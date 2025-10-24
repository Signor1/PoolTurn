-include .env

deploy_rosca:
	@echo `deploying to the ${NETWORK_NAME}`
	forge script script/Rosca.s.sol:RoscaSecureScript --rpc-url ${RPC_URL} --private-key ${PRIVATE_KEY} --broadcast -vvvv