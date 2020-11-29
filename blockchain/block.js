const { GENESIS_DATA, MINE_RATE } =require('../config')
const { cryptoHash } = require('../util')
const hexToBinary = require('hex-to-binary')


class Block{
    constructor({timestamp,lastHash,hash,data,nonce,difficulty}){
        this.timestamp = timestamp
        this.lastHash = lastHash
        this.hash = hash
        this.data = data
        this.nonce = nonce
        this.difficulty = difficulty
    }
    static genesis(){
    return new Block(GENESIS_DATA)
    }
    static minedBlock({lastBlock,data}){
        let timestamp,hash
        const lastHash = lastBlock.hash
        let nonce = 0
        let { difficulty } = lastBlock

        do{
            nonce++
            timestamp = Date.now()
            difficulty = Block.adjustDifficulty( {originalBlock : lastBlock, timestamp })
            hash = cryptoHash(lastHash,difficulty,data,timestamp,nonce)
        }while(hexToBinary(hash).substring(0,difficulty) !== '0'.repeat(difficulty))
        
        return new this({ timestamp ,lastHash,data,nonce,difficulty,hash })
    }
    static adjustDifficulty({originalBlock,timestamp}){
        const { difficulty } = originalBlock
        if(difficulty<1) return 1         
        if(originalBlock.timestamp + MINE_RATE < timestamp) return difficulty -1
        
        return difficulty + 1 
    }
}


module.exports = Block