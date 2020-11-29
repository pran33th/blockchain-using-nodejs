const Wallet = require('./index')
const { verifySignature } = require('../util')
const Transaction = require('./transaction')
const Blockchain = require('../blockchain')
const { STARTING_BALANCE } = require('../config')
const { calculateBalance } = require('./index')

describe('wallet',()=> {
    let wallet

    beforeEach(()=> {
        wallet = new Wallet()
    })

    it('has a balance',()=> {
        expect(wallet).toHaveProperty('balance')
    })
    it('has a publickey',()=> {
        
        expect(wallet).toHaveProperty('publicKey')
    })    

    describe('sigining data',()=> {
        const data = "new data"

        it('verifies a signature',()=> {
           expect( verifySignature({
                publicKey:wallet.publicKey,
                data,
                signature: wallet.sign(data)
            })).toBe(true)
        })
        it('does not verify an invalid signature',()=> {
            expect(
                verifySignature({
                    publicKey:wallet.publicKey,
                    data,
                    signature: new Wallet().sign(data)
                })
            )
        })
    })
    describe('Create transaction',()=> {
        describe('and the amount exceeds the balance',()=>{
            it('throws an error',()=> {
                expect(()=> {wallet.createTransaction({amount:999999,recipient:'fake recipient'})}).toThrow('Amount exceeds balance')
            })
        })
        describe('and the amount is valid',()=> {
            let transaction,amount,recipient
            beforeEach(()=> {
                amount = 50
                recipient= 'foo-recipient'
                transaction = wallet.createTransaction({amount,recipient})
            })
            it('it creates an instance of Transaction',()=> {
                expect(transaction instanceof Transaction).toBe(true)
            })
            it('matches the transaction input with the wallet',()=>{
                expect(transaction.input.address).toEqual(wallet.publicKey)
            })
            it('outputs the amount the recipient',()=> {
                expect(transaction.outputMap[recipient]).toEqual(amount)
            })
        })
        describe('and a chain is passed',()=> {
            it('calls Wallet.calculateBalance',()=> {
                const walletBalanceMock = jest.fn()

                const originalCalculateBlance = Wallet.calculateBalance
                Wallet.calculateBalance = walletBalanceMock

                wallet.createTransaction({recipient: 'foo', amount : 10, chain: new Blockchain().chain})
                expect(walletBalanceMock).toHaveBeenCalled()

                Wallet.calculateBalance = originalCalculateBlance
            })
        })
    })
    describe('calculateBalance()',()=> {
        let blockchain

        beforeEach(()=>{
            blockchain = new Blockchain()
        })

        describe('and there sre no output vallues for the wallet',()=>{
            it('returns the starting balance',()=> {
                expect(Wallet.calculateBalance({
                    chain : blockchain.chain,
                    address: wallet.publicKey
                })).toEqual( STARTING_BALANCE )
                
            })
        })
        describe('and there are outputs for the wallet',()=> {
            let transactionOne, transactionTwo

            beforeEach(()=> {
                transactionOne = new Wallet().createTransaction({
                    recipient: wallet.publicKey,
                    amount: 50
                })
                transactionTwo = new Wallet().createTransaction({
                    recipient: wallet.publicKey,
                    amount: 60
                })
                blockchain.addBlock({data: [transactionOne,transactionTwo]})
            })
            it('adds the sum of all outputs to the wallet',()=>{
                expect(
                    Wallet.calculateBalance({
                        chain: blockchain.chain,
                        address: wallet.publicKey
                    })).toEqual(STARTING_BALANCE + transactionOne.outputMap[wallet.publicKey] + transactionTwo.outputMap[wallet.publicKey])
            })
            describe('and the wallet has made a transaction',()=> {
                let recentTransaction

                beforeEach(()=>{
                    recentTransaction = wallet.createTransaction({
                        recipient : 'foo-address',
                        amount:30
                    })

                    blockchain.addBlock({ data: [recentTransaction] })
                })
                it('returns the output amount of the recent transaction',()=> {
                    expect(Wallet.calculateBalance({
                        chain: blockchain.chain,
                        address: wallet.publicKey
                    })).toEqual(recentTransaction.outputMap[wallet.publicKey])
                })
                describe('and there are outputs next to and after the recent transacion',()=>{
                    let sameBlockTransaction, nextBlockTransaction

                    beforeEach(()=>{
                        recentTransaction = wallet.createTransaction({
                            recipient: 'later-foo-address',
                            amount: 60
                        })

                    sameBlockTransaction = Transaction.rewardTransaction({ minerWallet:wallet})

                    blockchain.addBlock({ data: [recentTransaction,sameBlockTransaction] })

                    nextBlockTransaction = new Wallet().createTransaction({
                        recipient: wallet.publicKey,amount:75   
                    })

                    blockchain.addBlock({ data: [nextBlockTransaction] })
                })
                it('includes the output amounts to the returned balance',()=>{
                    expect(
                        Wallet.calculateBalance({
                            chain:blockchain.chain,
                            address: wallet.publicKey
                        })
                    ).toEqual(recentTransaction.outputMap[wallet.publicKey] +
                        sameBlockTransaction.outputMap[wallet.publicKey] +
                        nextBlockTransaction.outputMap[wallet.publicKey])
                })
                })
            })
        })

    })
})