#![no_std]
use soroban_sdk::{contract, contractimpl};

mod test;
mod token_helpers;

#[contract]
pub struct CheeseVault;

#[contractimpl]
impl CheeseVault {}
