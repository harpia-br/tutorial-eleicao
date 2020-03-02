pragma solidity ^0.5.0;

contract Eleicao {
	uint public contagemDeTarefas = 0;

	struct Candidato {
		uint id;
		string nome;
		uint128 votos;
	}

	event votoEfetivado (uint indexed candidato_id);

	mapping(uint => Candidato) public candidatos;

	mapping(address => bool) public eleitores;

	uint public contagemDeCandidatos;

	function criarCandidato(string memory nome) private {
		contagemDeCandidatos ++;
		candidatos[contagemDeCandidatos] = Candidato(contagemDeCandidatos, nome, 0);
	}

	constructor() public {
		criarCandidato('Candidato Um');
		criarCandidato('Candidato Dois');
	}

	function votar (uint candidato_id) public {
		require(!eleitores[msg.sender]);
		require(candidato_id > 0 && candidato_id <= contagemDeCandidatos);
		eleitores[msg.sender] = true;
		candidatos[candidato_id].votos ++;

		emit votoEfetivado(candidato_id);
	}

}
