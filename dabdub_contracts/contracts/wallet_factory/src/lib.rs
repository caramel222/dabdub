#![no_std]
use soroban_sdk::{contract, contractimpl};

#[contract]
pub struct WalletFactory;

#[contractimpl]
impl WalletFactory {}

mod test;
