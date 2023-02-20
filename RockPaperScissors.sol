// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract RockPaperScissors is Ownable {
    uint public betAmount;
    uint public gamesCount;

    enum HandSign { None, Rock, Paper, Scissors }

    struct Game {
        address player;
        HandSign playerHandSign;
        HandSign botHandSign;
        uint result;
        bool finished;
    }

    mapping (uint => Game) public games;

    event GameStarted(uint indexed gameId, address indexed player, uint betAmount);
    event GameFinished(uint indexed gameId, address indexed player, HandSign playerHandSign, HandSign botHandSign, uint result);

    constructor() {
        betAmount = 1 ether;
    }

    function play(uint _handSign) public payable {
        require(msg.value == betAmount, "Bet amount is not correct");

        HandSign handSign = HandSign(_handSign);
        require(handSign == HandSign.Rock || handSign == HandSign.Paper || handSign == HandSign.Scissors, "Invalid hand sign");

        uint gameId = gamesCount;
        games[gameId] = Game(msg.sender, handSign, HandSign.None, 0, false);
        gamesCount += 1;

        emit GameStarted(gameId, msg.sender, msg.value);

        botPlay(gameId);
    }

    function playWithMetamask(uint _handSign) public {
        HandSign handSign = HandSign(_handSign);
        require(handSign == HandSign.Rock || handSign == HandSign.Paper || handSign == HandSign.Scissors, "Invalid hand sign");

        uint gameId = gamesCount;
        games[gameId] = Game(msg.sender, handSign, HandSign.None, 0, false);
        gamesCount += 1;

        emit GameStarted(gameId, msg.sender, betAmount);
    }

    function botPlay(uint gameId) internal {
        Game storage game = games[gameId];
        require(game.finished == false, "Game has already finished");

        uint botHandSign = uint(keccak256(abi.encodePacked(block.timestamp, gameId, owner()))) % 3 + 1;
        game.botHandSign = HandSign(botHandSign);

        finishGame(gameId);
    }

    function finishGame(uint gameId) internal {
        Game storage game = games[gameId];
        require(game.finished == false, "Game has already finished");

        if (game.playerHandSign == game.botHandSign) {
            game.result = 0;
        } else if ((game.playerHandSign == HandSign.Rock && game.botHandSign == HandSign.Scissors) ||
                   (game.playerHandSign == HandSign.Paper && game.botHandSign == HandSign.Rock) ||
                   (game.playerHandSign == HandSign.Scissors && game.botHandSign == HandSign.Paper)) {
            game.result = 1;
            payable(game.player).transfer(betAmount * 2);
        } else {
            game.result = 2;
        }

        game.finished = true;

        emit GameFinished(gameId, game.player, game.playerHandSign, game.botHandSign, game.result);
    }
}
