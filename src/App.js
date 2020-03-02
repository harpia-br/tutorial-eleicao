/* Biblioteca para criar nossos componentes */
import React from 'react';
/* Biblioteca para acessar contratos na rede Ethereum */
import Web3 from 'web3';
/* Importando o contrato */
import Eleicao from './abis/Eleicao.json'
/* Componentes para nossa aplicação web */
import {
	Table,
	Container,
	Button,
} from 'react-bootstrap'

/* Declaração do nosso componente */
class App extends React.Component {

	/* Alguns componentes React tem um 'estado', com dados, 
	 * para controlar a renderização do componente */
	state = {
		/* Variável para manejar o processamento dos dados */
		carregando: true,
		/* Variável para guardar a lista de candidato dentro do contrato */
		candidatos: [],
		/* Variável para guardar a conta que está selecionada no Metamask */
		conta: null,
		/* Variável para selecionar o candidato */
		candidato_id: '',
		/* Variável para guardar o contrato que vamos utilizar */
		contrato: null,
		jaVotei: false,
	}

	/* Função que participa do ciclo de vida do componente com estado,
	 * ela é chamada quando o componente está montado, essa no caso é
	 * ideal para fazer solicitações assíncronas, palavra chave 'async' 
	 * facilita o trabalho com funções assíncronas, fazendo parte da ES7
	 * do JavaScript */
	async componentDidMount() {
		/* Todas as solicitações Web3 são assíncronas e o uso do ES7 async await
		 * ajuda muito a reduzir o código e facilita a manutenção */

		/* Criando uma instância do Web3 */
		let web3 = null
		/* Browser novos já tem acesso a rede Ethereum, como Mist ou Metamask */
		if(window.ethereum){
			web3 = new Web3(window.ethereum)
			await window.ethereum.enable()
		}else{
			/* Acessando a extensão de acesso a rede Ethereum */
			if(window.web3){
				web3 = new Web3(Web3.givenProvider)
			}else{
				alert('Ethereum browser não detectado! Tente usar o Metamask')
				return false
			}
		}

		/* Pega as contas que estão no caso no Metamask e traz a selecionada */
		const contas = await web3.eth.getAccounts()
		const conta = contas[0]
		let balanco = await web3.eth.getBalance(conta)
		console.log('balanco: ', balanco)
		/* Dados da rede que estamo conecta no caso a rede Ganache */
		const rede_id = await web3.eth.net.getId()
		const dadosRede = Eleicao.networks[rede_id]
		if(dadosRede){
			/* Pegando o contrato com o arquivo gerado pelo Truffle e o endereço da nossa rede */
			const contrato = new web3.eth.Contract(Eleicao.abi, dadosRede.address)
			/* buscando os candidatos dentro do contrato */
			const contagemDeCandidatos = await contrato.methods.contagemDeCandidatos().call()
			const candidatos = []
			for (let i = 1;i <= contagemDeCandidatos ; i++) {
				candidatos.push(await contrato.methods.candidatos(i).call())
			}
			/* verificando se a conta já votou */
			const jaVotei = await contrato.methods.eleitores(conta).call()

			/* A função setState() alterar o estado do objeto, quando o estado é diferente do atual 
			 * o algoritmo de reconciliciação do React avalia o que vai mudar na redenrização e altera
			 * apenas aquela informação, esse é o que faz O react tão diferente e poderoso */
			this.setState({
				carregando: false,
				candidatos,
				contrato,
				conta,
				jaVotei,
			})

			/* Quando alterar uma conta no MetaMask mudar o estado */
			window.ethereum.on('accountsChanged', async (accounts) => {
				const conta = accounts[0]
				const jaVotei = await contrato.methods.eleitores(conta).call()

				this.setState({
					conta,
					jaVotei,
				})
			})

		}else{
			alert('Contrato não está implementado!')
		}
	}

	votar = async (id) => {
		const {
			contrato,
			conta,
		} = this.state
		try{
			this.setState({carregando: true})
			/* Acesso aos métodos públicos do contrato, quando um método altera o estado
			 * do contrato usa-se o método 'send' com a conta do usuário selecionado 
			 * no Metamask além de usar 'Gas Fee', seria como a taxa de processamento,
			 * como por exemplo quando você faz uma compra na internet além do valor do
			 * produto paga-se a taxa de entrega que também é paga em valor por isso,
			 * na rede Ethereum a moeda é o Ether e o Gas seria uma fração de Ether,
			 * essa taxa é paga para quem faz o processamento, chamado de mineradores,
			 * ao chamar essa função um notificação do MetaMask mostra-rá os valores e
			 * se você aceita essa transação ou não */
			await contrato.methods.votar(id).send({from: conta})

			/* Logo depois de votar, buscar as o estado dos eleitores por conta e
			 * submeter ao estado para que o React faça a alteração da renderização */
			const jaVotei = await contrato.methods.eleitores(conta).call()
			this.setState({
				carregando: false,
				jaVotei,
			})
		} catch (error) {
			this.setState({
				carregando: false,
			})
			alert('Transação Rejeitada!')
		}
	}

	/* Função que informa ao React o que criar usando JSX, que facilita a criação
	 * de componentes que é justamente o uso de tags informa ao tradutor Babel para
	 * gerar um código Javascript ao executar a classe */
	render(){
		const {
			carregando,
			candidatos,
			conta,
			jaVotei,
		} = this.state
		return (
			<Container
				style={{
					textAlign: 'center',
					borderWidth: '.2rem .2rem 0',
					borderRadius: '8px 8px 0 0',
					sition: 'relative',
					padding: '1rem',
					border: '.2rem solid #ececec',
					color: '#212529',
					marginTop: 20,
				}}>
				<h2>Votação no Blockchain</h2>
				<hr />
				{
					carregando &&
						<h2>Carregando...</h2>
				}
				{
					!carregando &&
						candidatos &&
						!jaVotei &&
						<>
							<h2>Lista de Candidatos na Blockchain</h2>
							<Table striped bordered hover>
								<tbody>
									{
										candidatos.map(candidato => {
											return <tr key={candidato.id}>
												<td>{candidato.nome}</td>
												<td>
													<Button
														type='button'
														onClick={() => this.votar(candidato.id)}>
														Votar
													</Button>
												</td>
											</tr>
										})
									}
								</tbody>
							</Table>
						</>
				}
				{
					!carregando &&
						jaVotei &&
						<h4>Já votei!</h4>
				}
				{
					!carregando &&
						<>
							<hr />
							<small>Conta: {conta}</small>
						</>
				}
			</Container>
		);
	}
}

export default App;
