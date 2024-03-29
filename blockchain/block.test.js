const Block = require("./block")
const { GENESIS_DATA, MINE_RATE } = require("../config")
const { cryptoHash } = require("../util")
const hexToBinary = require('hex-to-binary')


describe('Block',()=>{
    const timestamp = 2000
    const lastHash = 'some-last-hash'
    const hash = 'present hash'
    const data = 'some data in block'
    const nonce = 1
    const difficulty = 1
    const block = new Block({timestamp,lastHash,hash,data,nonce,difficulty})

    it('a block has a timestamp, a lasthash,a hash and a data property',()=>{
        expect(block.timestamp).toEqual(timestamp)
        expect(block.lastHash).toEqual(lastHash)
        expect(block.hash).toEqual(hash)
        expect(block.data).toEqual(data )
        expect(block.nonce).toEqual(nonce)
        expect(block.difficulty).toEqual(difficulty)
    })

    describe('genesis()',()=>{
        const genesisBlock = Block.genesis()
        it('returns a block instance',()=> {
            expect(genesisBlock instanceof Block).toBe(true)
        })
        it('returns the genesis data',()=> {
            expect(genesisBlock).toEqual(GENESIS_DATA)
        })
    })
    describe('mine block',()=>{
        const lastBlock = Block.genesis()
        const data = 'mined data'
        const minedBlock = Block.minedBlock({data,lastBlock})
        
        it('returns a Blockinstance',()=> {
            expect(minedBlock instanceof Block).toBe(true)
        })
        it('sets the lastHash to be the hash of the lastBlock',()=> {
            expect(minedBlock.lastHash).toEqual(lastBlock.hash)
        } )
        it('sets the data ',()=> {
            expect(minedBlock.data).toEqual(data)
        })
        it('sets a timestamp',()=>{
            expect(minedBlock.timestamp).not.toEqual(undefined)
        })
        it('returns a SHA256 hash based on the proper inputs',()=>{
            expect(minedBlock.hash).toEqual(cryptoHash(minedBlock.timestamp,data,minedBlock.nonce,minedBlock.difficulty,lastBlock.hash,))
        })
        it('it sets a hash that matches the difficulty criteria',()=>{
            expect(hexToBinary(minedBlock.hash).substring(0,minedBlock.difficulty)).toEqual('0'.repeat(minedBlock.difficulty))
        })
        it('it adjusts the difficulty',()=> {
            const possibleResults = [lastBlock.difficulty+1,lastBlock.difficulty-1]

            expect(possibleResults.includes(minedBlock.difficulty)).toBe(true)
        })

        
    })
    describe('adjust difficulty',() => {
        it('raises the difficulty for a quickly mined block',()=> { 
            expect(Block.adjustDifficulty({ originalBlock : block , timestamp:block.timestamp + MINE_RATE -100})).toEqual(block.difficulty+1)
        })
        it('lowers the difficulty for a slowly mined block',()=> {
            expect(Block.adjustDifficulty({ originalBlock : block , timestamp:block.timestamp + MINE_RATE +100})).toEqual(block.difficulty-1)

        })
        it('has a lower limit of 1',() => {
            block.difficulty = -1
            
            expect(Block.adjustDifficulty({originalBlock: block})).toEqual(1)
        })
    })
})