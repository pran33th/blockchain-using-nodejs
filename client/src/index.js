import React from 'react'
import { render } from 'react-dom'
import { Router, Switch, Route } from 'react-router-dom'
import history from './history'
import App from './components/App'
import Blocks from './components/Blocks'
import './index.css'
import ConductTransaction from './components/ConductTransaction'
import TransactionPool from './components/TransactionPool'



render(
<Router history={history}>
    <Switch>
        <Route path="/" exact component = {App} />
        <Route path="/blocks" component={Blocks} />
        <Route path="/conduct-transaction" component={ConductTransaction} />
        <Route path="/transaction-pool" component={TransactionPool} />
    </Switch>
</Router>,
    document.getElementById('root'))