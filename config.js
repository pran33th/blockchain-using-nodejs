const INITIAL_DIFFICULTY = 6
const MINE_RATE = 1500
const STARTING_BALANCE = 1000
const REWARD_INPUT = {
    address: '*authorized-reward*'
    
}
const MINING_REWARD = 50
const GENESIS_DATA = {
    timestamp : 1,
    lastHash : '------',
    hash : 'hash-genesis',
    data : [],
    nonce : 0,
    difficulty : INITIAL_DIFFICULTY
}

module.exports = { GENESIS_DATA,MINE_RATE,STARTING_BALANCE,REWARD_INPUT,MINING_REWARD }