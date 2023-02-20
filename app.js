//const web3 = new Web3(Web3.givenProvider);
const web3 = new ethers.providers.Web3Provider(window.ethereum, 97)//ChainID 97 BNBtestnet
//const web3 = new Web3('https://data-seed-prebsc-1-s1.binance.org:8545');

const contractAddress = "0x8Ca3e5d2133346b6fbF9F52f0A5372E62BC43b56";
const contractABI = [
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "gameId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "enum RockPaperScissors.HandSign",
				"name": "playerHandSign",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "enum RockPaperScissors.HandSign",
				"name": "botHandSign",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "result",
				"type": "uint256"
			}
		],
		"name": "GameFinished",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "gameId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "betAmount",
				"type": "uint256"
			}
		],
		"name": "GameStarted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_handSign",
				"type": "uint256"
			}
		],
		"name": "play",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_handSign",
				"type": "uint256"
			}
		],
		"name": "playWithMetamask",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "betAmount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "games",
		"outputs": [
			{
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"internalType": "enum RockPaperScissors.HandSign",
				"name": "playerHandSign",
				"type": "uint8"
			},
			{
				"internalType": "enum RockPaperScissors.HandSign",
				"name": "botHandSign",
				"type": "uint8"
			},
			{
				"internalType": "uint256",
				"name": "result",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "finished",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "gamesCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

const contract = new web3.eth.Contract(contractABI, contractAddress);

const playForm = document.getElementById("play-form");
const handSignSelect = document.getElementById("hand-sign");
const resultDiv = document.getElementById("result");

playForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  
  const handSign = handSignSelect.value;
  const betAmount = web3.utils.toWei("1", "ether");
  
  const accounts = await ethereum.request({ method: "eth_requestAccounts" });
  const account = accounts[0];
  
  contract.methods.play(handSign).send({ from: account, value: betAmount })
    .once("transactionHash", (hash) => {
      console.log("Transaction hash:", hash);
    })
    .once("receipt", (receipt) => {
      console.log("Transaction receipt:", receipt);
      const gameId = receipt.events.GameStarted.returnValues.gameId;
      const player = receipt.events.GameStarted.returnValues.player;
      const betAmount = receipt.events.GameStarted.returnValues.betAmount;
      resultDiv.textContent = "Waiting for result...";
      checkResult(gameId, player, betAmount);
    });
});

function checkResult(gameId, player, betAmount) {
  const gameFinishedEvent = contract.events.GameFinished({ filter: { gameId: gameId } });
  gameFinishedEvent.on("data", (event) => {
    console.log("Game finished:", event);
    if (event.returnValues.player.toLowerCase() === player.toLowerCase()) {
      const result = event.returnValues.result;
      if (result == 0) {
        resultDiv.textContent = "Tie!";
      } else if (result == 1) {
        resultDiv.textContent = "You won!";
        web3.eth.getBalance(contractAddress, (error, balance) => {
          const winnings = web3.utils.fromWei(balance, "ether");
          resultDiv.textContent += ` You won ${winnings} ether!`;
        });
      } else {
        resultDiv.textContent = "You lost!";
      }
    }
  });
}
