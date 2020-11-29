import { Link } from 'react-router-dom'
import React, { Component } from 'react'
import logo from '../assets/logo1.png'

class App extends Component{
    state = { walletInfo: {}}

    componentDidMount(){
        fetch(`${document.location.origin}/api/walletinfo`)
        .then(res => res.json())
        .then(json => this.setState({ walletInfo: json }))
    }

    render(){
        const { address,balance } = this.state.walletInfo
      
        return(
            <div className='App'>
                <img className='logo' src={logo}></img>
                <br />
                <div>welcome....</div> 
                <br />
                <div><Link to='/blocks' >Blocks</Link></div>
                <div><Link to='/conduct-transaction' >Conduct a Transaction</Link></div>
                <div><Link to='/transaction-pool' >Transaction Pool</Link></div>
                <br />
                <div className='walletInfo'>
                <div>Address: {address} </div>
                <div>Balance: {balance} </div>
                </div>
                <br />
                
            </div>
        )
    }
}

export default App