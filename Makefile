-include .env

deploy_poolturn:
	@echo `deploying to the ${NETWORK_NAME}`
	forge script script/PoolTurnSecure.s.sol:PoolTurnSecureScript --rpc-url ${BASE_MAINNET_RPC_URL} --private-key ${PRIVATE_KEY} --broadcast -vvvv