import React,{ Component } from 'react'
import { Link } from 'react-router-dom'
import Transaction from './Transaction'
import { Button } from 'react-bootstrap'
import history from '../history'

const POLL_INTERVAL_MS = 10000

class TransactionPool extends Component{
    state = { transactionPoolMap: {} }

    fetchTransactionPoolMap = () => {
        fetch(`${document.location.origin}/api/transactionpoolmap`) 
        .then(response => response.json())
        .then(json => this.setState({transactionPoolMap : json}))
    }

    fetchMineTransactions = () => {
        fetch(`${document.location.origin}/api/minetransactions`)
        .then(response => {
            if(response.status===200){
                alert('success')
                history.push('/blocks')
            }
            else{
                alert('The Mine-Transactions block request did not complete. ')
            }
        })
    }

    componentDidMount(){
        this.fetchTransactionPoolMap()

        this.fetchPoolMapInterval=setInterval(
            ()=> this.fetchTransactionPoolMap(),
            POLL_INTERVAL_MS
        )
    }

    componentWillUnmount(){
        clearInterval(this.fetchPoolMapInterval)
    }

    render(){
        return(
            <div className='TransactionPool'>
            <div><Link to='/'>Home</Link></div>
            <h3>TransactionPool</h3>
            {

                Object.values( this.state.transactionPoolMap).map(transaction =>{
                    return(
                        <div key = {transaction.id}>
                            <hr />
                            <Transaction transaction={transaction} />
                        </div>
                    )
                })
            }
            <hr />
            <Button 
            onClick={this.fetchMineTransactions}>
                Mine the transactions
                </Button>
            </div>
        )
    }
}

export default TransactionPool 