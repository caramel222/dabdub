#![no_std]
use soroban_sdk::{contract, contractimpl};

#[contract]
pub struct UserWallet;

#[contractimpl]
impl UserWallet {}

mod test;
