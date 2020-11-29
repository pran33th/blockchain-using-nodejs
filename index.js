const express = require('express')
const path = require('path')
const request = require('request')
const Blockchain = require('./blockchain')
const bodyParser = require('body-parser')
const PubSub = require('./app/pubsub')
const TransactionPool = require('./wallet/transction-pool')
const Wallet = require('./wallet')
const { response } = require('express')
const TransactionMiner = require('./app/transaction-miner')


const isDevelopment = process.env.ENC === 'development'
const REDIS_URL = isDevelopment ?
'redis://127.0.0.1:6379' :
'redis://:p05a5365e0f21e12372fabd8a9ebae91e9653214b1e8957778dcea56a789725ad@ec2-3-213-218-18.compute-1.amazonaws.com:8919'

const DEFAULT_PORT = 3000
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`


const app = express()
const blockchain = new Blockchain()
const wallet = new Wallet()
const transactionPool = new TransactionPool()
const pubsub = new PubSub({ blockchain, transactionPool, redisUrl: REDIS_URL })
const transactionMiner = new TransactionMiner({ blockchain,transactionPool,wallet,pubsub })





app.use(bodyParser.json())
app.use(express.static(path.join(__dirname,'client/dist')))

app.get('/api/blocks',(req,res)=> {
    res.json(blockchain.chain)
})
app.post('/api/mine',(req,res) => {
    const {data} = req.body

    blockchain.addBlock( {data} )
    pubsub.broadcastChain()
    res.redirect('/api/blocks')
})

app.get('/api/transactionpoolmap',(req,res)=> {
    res.json(transactionPool.transactionMap)
})

app.get('/api/minetransactions',(req,res)=> {
    transactionMiner.mineTransactions()

    res.redirect('/api/blocks')
})

app.get('/api/walletinfo',(req,res)=> {
    const address = wallet.publicKey
    res.json({
        address: wallet.publicKey,
        balance: Wallet.calculateBalance({ chain:blockchain.chain , address })
    })
})

app.post('/api/transact',(req,res) => {
    const { amount, recipient } = req.body
    
    let transaction = transactionPool.existingTransaction({inputAddress : wallet.publicKey})

    try{
        if(transaction){
            transaction.update({senderWallet:wallet,recipient,amount})
        }
        else{
         transaction = wallet.createTransaction({ amount,recipient,chain: blockchain.chain })
        }
    }
    catch(error){
        return res.status(400).json({type : 'error', message : error.message})
    }
    transactionPool.setTransaction(transaction)
    pubsub.broadcastTransaction(transaction)

    res.json({type:"success", transaction })
})

app.get('*',(req,res)=> {
    res.sendFile(path.join(__dirname,'client/dist/index.html'))
})

const syncWithRootState = () => {
    request( { url: `${ROOT_NODE_ADDRESS}/api/blocks` },(error,response,body) => {
        if(!error && response.statusCode === 200){
            const rootChain = JSON.parse(body)
            
            console.log('replace the chain on a sync with ',rootChain)
            blockchain.replaceChain(rootChain)
        }
})
request({url: `${ROOT_NODE_ADDRESS}/api/transactionpoolmap`},(error,response,body)=> {
    if(!error && response.statusCode === 200){
        const rootTransactionPoolMap= JSON.parse(body)
        console.log('replace transaction pool map on a sync with ',rootTransactionPoolMap)
        transactionPool.setMap(rootTransactionPoolMap)
    }
})
}

if(isDevelopment){

const walletf = new Wallet()
const walletb = new Wallet()

const genearateWalletTransactions = ({wallet,recipient,amount}) => {
    const transaction = wallet.createTransaction({
        recipient,amount,chain:blockchain.chain
    })
    transactionPool.setTransaction(transaction)
}

const walletAction = ()=> genearateWalletTransactions({
    wallet,recipient: walletf.publicKey, amount:11
})

const walletfaction = () =>genearateWalletTransactions({
    wallet: walletf, recipient: walletb.publicKey, amount: 10
})

const walletbaction = () => genearateWalletTransactions({
    wallet: walletb, recipient: wallet.publicKey , amount: 15
})

for (let i=0;i<10;i++){
    if(i%3 ===0){
        walletAction()
        walletfaction()
    }
    else if(i%2 ===1){
        walletfaction()
        walletbaction()
    }
    else{
        walletbaction()
        walletAction()
    }

    transactionMiner.mineTransactions()
}
}
let PEER_PORT

if(process.env.GENERATE_PEER_PORT === 'true'){
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000)
}

const PORT = process.env.PORT || PEER_PORT || DEFAULT_PORT
app.listen(PORT,()=>{
    console.log(`listening on localhost:${PORT}`)
    if(PORT !== DEFAULT_PORT){
    syncWithRootState()
    }
})