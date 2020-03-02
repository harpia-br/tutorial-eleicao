const Eleicao = artifacts.require('./Eleicao.sol');

module.exports = function(implatador) {
	 implatador.deploy(Eleicao);
};
