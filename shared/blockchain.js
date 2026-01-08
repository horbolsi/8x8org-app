const { ethers } = require('ethers');

class BlockchainUtils {
    static formatAddress(address) {
        if (!address || address.length < 10) return address;
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    static isValidAddress(address) {
        return ethers.isAddress(address);
    }

    static async getGasPrice() {
        try {
            const provider = new ethers.JsonRpcProvider('https://rpc.ankr.com/eth');
            const feeData = await provider.getFeeData();
            return {
                gasPrice: ethers.formatUnits(feeData.gasPrice || 0, 'gwei'),
                maxFeePerGas: ethers.formatUnits(feeData.maxFeePerGas || 0, 'gwei')
            };
        } catch (error) {
            console.error('Gas price error:', error.message);
            return null;
        }
    }
}

module.exports = BlockchainUtils;
