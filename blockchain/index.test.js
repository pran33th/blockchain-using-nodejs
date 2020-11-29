const Blockchain = require('./index')
const Block = require('./block')
const { cryptoHash } = require('../util')
const Wallet = require('../wallet')
const Transaction = require('../wallet/transaction')
const TransactionMiner = require('../app/transaction-miner')


describe('Blockchain',()=> {
    let blockchain,newChain,originalChain
    beforeEach(()=>{ 
         blockchain = new Blockchain()
         newChain = new Blockchain()

         originalChain = blockchain.chain
    })

    it('contains a chain Array instance',()=> {
        expect(blockchain.chain instanceof Array).toBe(true)
    })

    it('starts with a genesis block',()=> {
        expect(blockchain.chain[0]).toEqual(Block.genesis())
        
    })

    it('adds a new block to the blockchain',()=> {
        const newData= 'sample data'
        blockchain.addBlock({data : newData})
        expect(blockchain.chain[blockchain.chain.length-1].data).toEqual(newData)
    })
    describe('isValidChain()',()=>{
        beforeEach(()=> {
            blockchain.addBlock({data:'new one'})
            blockchain.addBlock({data:'second one'})
            blockchain.addBlock({data:'last one'})

        })
        describe('when the chain does not start with the genesis block',()=>{
            it('returns false',()=>{
                blockchain.chain[0] = { data:'fake-genesis' }
                expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)
            })
        })
        describe('when the chain starts with the genesis block and has multiple blocks',()=>{
            describe('and a lastHash reference has changed',()=>{
                it('returns false',()=> {

                    blockchain.chain[2].lastHash = 'my dirty hash'

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)
                })
            })
            describe('and the chain contains a block with an invalid data',()=>{
                it('returns false',()=> {
                   
                    blockchain.chain[2].data = 'my dirty data'

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)
                })
            })
            describe('and the chain contains a block with a jumped difficulty',()=>{
                it('returns false',()=> {
                    const lastBlock = blockchain.chain[blockchain.chain.length-1]

                    const lastHash = lastBlock.hash

                    const timestamp = Date.now()

                    const nonce=0
                    const data=[]
                    const difficulty = lastBlock.difficulty -3  

                    const hash = cryptoHash(timestamp,data,difficulty,nonce,lastHash)

                    const badBlock = new Block({ timestamp,lastHash,difficulty,nonce,hash,data})

                    blockchain.chain.push(badBlock)

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(false)
                })
            })
            describe('and the chain does not contain any invalid blocks',()=>{
                it('returns true',()=> {

                    expect(Blockchain.isValidChain(blockchain.chain)).toBe(true)
                    
                })
            })
        })
        
    }) 
    describe('replaceChain()',()=>{
        let errorMock,logMock
        beforeEach(()=> {
            errorMock = jest.fn()
            logMock = jest.fn()

            // global.console.error = errorMock
            // global.console.log = logMock
        })
        describe('when the chain is not longer',()=> {
            beforeEach(()=> {
                newChain.chain[0] = { new : 'chain'}
                blockchain.replaceChain(newChain.chain)

            })
            it('does not replace the chain',()=>{
               
                expect(blockchain.chain).toEqual(originalChain)
            })
            // it('logs an error',()=>{
            //     expect(errorMock).toHaveBeenCalled()
            // })
        })
        describe('when the chain is longer',( )=> {
            beforeEach(() => {
            newChain.addBlock({data:'new one'})
            newChain.addBlock({data:'second one'})
            newChain.addBlock({data:'last one'})
            })
            describe('the chain is invalid',()=>{
                beforeEach(()=>{
                    newChain.chain[2].hash = 'some fake-hash'

                    blockchain.replaceChain(newChain.chain)
                })
                it('it does not replace the chain',() => {

                    expect(blockchain.chain).toEqual(originalChain)
                })
                // it('logs an error',()=>{
                //     expect(errorMock).toHaveBeenCalled()
                // })
            })
            describe('and the chain is valid',()=>{
                beforeEach(()=> {
                    blockchain.replaceChain(newChain.chain)
                })
                it('does replace the chain',()=>{
                    expect(blockchain.chain).toEqual(newChain.chain)
                })
                // it('logs about the chain replacement',()=>{
                //     expect(logMock).toHaveBeenCalled()
                // })
            })
        })
        describe('and the validateTransactions flag is true',()=>{
            it('calls the validateTransactionData()',()=>{
                const validTransactionDataMock = jest.fn()

                blockchain.validTransactionData = validTransactionDataMock

                newChain.addBlock({data: 'foo'})

                blockchain.replaceChain(newChain.chain,true)

                expect(validTransactionDataMock).toHaveBeenCalled()
            })
        })
    })
    describe('validTransactionData()',()=>{
        let transaction,rewardTransaction,wallet

        beforeEach(()=>{
            wallet = new Wallet()
            transaction = wallet .createTransaction({ recipient:'foo-address',amount:65 })
            rewardTransaction = Transaction.rewardTransaction({ minerWallet: wallet }) 
        })
        describe('and the tansaction data is valid',()=> {
            it('returns true',()=> {
                newChain.addBlock({ data : [transaction,rewardTransaction]})
                expect(blockchain.validTransactionData({ chain:newChain.chain })).toBe(true)
            })
        })
        describe('and the transaction data has multiple rewards',()=> {
            it('returns false',()=> {
                newChain.addBlock({ data: [transaction,rewardTransaction,rewardTransaction] })

                expect(blockchain.validTransactionData({chain: newChain.chain})).toBe(false)
            })
        })
        describe('and the transaction data has at least one malformed outputMap',()=> {
            describe('and the transaction is not a reward transaction',()=> {
                it('returns false',()=> {
                    transaction.outputMap[wallet.publicKey] = 999999

                    newChain.addBlock({ data: [transaction,rewardTransaction] })

                    expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false)
                })
            })
            describe('and the transaction is a reward transaction',()=> {
                it('returns false',()=> {
                    rewardTransaction.outputMap[wallet.publicKey] = 999999

                    newChain.addBlock({ data: [transaction,rewardTransaction]})

                    expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false)

                })
            })
        })
        describe('and the transaction data has atleast one malformed input',()=> {
            it('returns false',()=>{
                wallet.balance = 9000

                const evilOutputMap = {
                    [wallet.publicKey]: 8900,
                    foorecipient :100
                }

                const EvilTransaction = {
                    input: {
                        timestamp: Date.now(),
                        amount:wallet.balance,
                        address:wallet.publicKey,
                        signature:wallet.sign(evilOutputMap)
                    },
                    outputMap : evilOutputMap
                }
                newChain.addBlock( {data:[EvilTransaction,rewardTransaction] })
                expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false)

            })
        })
        describe('and a block conatins multiple identical transactions',()=> {
            it('returns false',()=> {
                newChain.addBlock({
                    data: [transaction,transaction,transaction,rewardTransaction]
                })
                expect(blockchain.validTransactionData({ chain: newChain.chain })).toBe(false)
            })
        })
    })
})