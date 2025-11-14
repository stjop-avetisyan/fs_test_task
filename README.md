# Peter and Sons Full Stack Developer Test
* note. requirements are  on high level, so you can use your creativity to implement them.
* in any case something is not clear or you need some assistance , please ask me with [@StjopAvetisyan](https://t.me/stjopAvetisyan) (Telegram) 

## The meaning of this test is to have fully functional lightweight casino game platform.
#### It must be consisted of these components:
 - ### ``Game client``
 - ### ``Game server``
 - ### ``External Casino API``


## Game client:
It must be a simple HTML5 slot game client that can be launched in the browser. written in ReactJS.

#### DESCRIPTION:
- Slot machine must look like something like this:

 
[<img src="https://i.imgur.com/3Kjat13.jpeg" width="500"/>](image.png)

- Slot machine must have the following symbols: 🔔 🍒 🍇 🍊

#### 🔔 🔔 🔔 - Jackpot 20x of the bet max win can have some animation
#### 🍒 🍒 🍒 - 8x of the bet
#### 🍇 🍇 🍇 - 4x of the bet
#### 🍊 🍊 🍊 - 1x of the bet

- Symbols must have the following probabilities:

  | Symbol | Chance |
  |--------|--------|
  | 🍊     | 50%    |
  | 🍇     | 25%    |
  | 🍒     | 15%    |
  | 🔔     | 10%    |

- Game must have a bet selector with the following values: 
  ```[0.1, 0.5, 1, 2, 5, 10]```
 
- Game must have a spin button that will trigger the spin of the slot machine.
- Game must have a balance display that shows the current balance of the player.
___
### GAME FLOW:
1. When loading the game client, it must fetch the game configuration from the server via ```/config``` and display it in the UI 
2. Then it must get player information  via ```/player``` and display user info.
3. When the player clicks the spin button, it must send a request to the server via ```/spin``` with the bet amount and receive the result of the spin.


___
## Game Server:
- It must be a Node.js server that handles the game logic and communicates with the game client.
- It must have only following endpoints:
  - `/config` - returns game configuration
  - `/player` - returns player information
  - `/spin` - handles the spin request and returns the result of the spin
  - `/replay` - shows the replay of the round (optional)
- It must work with external casino API to handle player authentication, balance, transaction and game state.
- Communication with external casino must be done by implementing following [Interface](https://drive.google.com/file/d/1EzEYfZOJAQOa_Iigu0r8pCtBuQNHlAo2/view?usp=sharing):
- Each spin is a round, and each round must have deposit and withdraw transactions. (deposit - >  win , withdraw -> bet)
___
## External Casino API:
- External casino have these API endpoints:
    -  ```POST /authenticate``` - returns player info
        ```json
       "Request":
        {
          "operator": "Operator Name",
          "key": "Player auethentication key"
         }
          "Response":
       {
          "some keys": "some values"
       }
        ```
    -  `POST /balance` - returns player balance
        ```json
        
          "Response":
       {
          "some keys": "some values"
       }
        ```
    -  `PUT /transaction` - makes a transaction for the player
       ```json
       "Request":
       {
       "transactionId": "transaction id of game server",
       "roundId": "Round id of game server",
       "amount": "Amount to deposit or withdraw",
       "type": "deposit  or withdrawal"
       }
       "Response":
       {
       "some keys": "some values"
       }
        ```
    -  `DELETE /cancel` - cancels a transaction for the player
          ```json
       "Request":
        {
          "transactionId": "transaction id",
           
         }
          "Response":
       {
          "some keys": "some values"
       }
        ```
___
### Authentication and Authorization:

#### There is a 2 type of authorization going on here and  all the requests to the external casino API must be authenticated. 
   - Server to server calls must be authenticated with ```["x-server-authorization"]``` header
    ```javascript
         const auth_header = crypto.createHmac("sha256", secretKey).update(JSON.stringify(req.body)).digest("hex");
    ```
  *secret key will be provided.



   - Beside server-server authorization, the server must also authenticate player requests with ```["authorization"]``` header
    ```javascript
         const player_auth_header = "token " + token_from_authenticate_endpoint;
    ```
### The flow must be like this:
```sequence
 GAME CLIENT->> GAME SERVER(this service) ->> EXTERNAl CASINO API ->> GAME SERVER(this service) ->> GAME CLIENT
```
### Project Requirements

#### ✅ General Guidelines
- The entire project **must be written within this repository**.
- It's **recommended to create a separate branch** and open a **Pull Request (PR) to `main`** for submission.

#### 🐳 Dockerization
- The project **must be Dockerized**.
- It should be runnable inside a container using **a single command** (e.g., `docker-compose up`).

#### 🧑‍💻 Tech Stack
- All source code **must be written in TypeScript**.
- The **database must be PostgreSQL**, also running via **Docker container**.


#### ✅ Optional Enhancements
- **Unit tests** written with **Jest** are optional but would be considered a **plus**.

 

---

How to run (Docker)

1) Copy environment file

   cp env.example .env

2) Build and start all services

- Prerequisites: Docker and docker-compose
  - Single command: 
```bash
  docker-compose up --build
```

Services:
- Client (React): http://localhost:5173
- Game Server (Node/Express): http://localhost:3000
- PostgreSQL: localhost:5432 (user: casino, password: casino, db: casino)

Local development (without Docker)

1) Copy environment file

   cp env.example .env

2) Start PostgreSQL (you can also use docker-compose db only)

3) Start the server

   cd server
   npm install
   npm run dev

4) Start the client in a different terminal

   cd client
   npm install
   npm run dev

Game flow in this repo
- The client calls /config and /player on the game server.
- On each spin, the server performs a withdrawal for the bet and a deposit for any win, records the round in PostgreSQL, and returns the result to the client.


Run tests (Jest)

To run the unit tests for the Node.js game server (Jest + TypeScript):

1) Install dependencies

   cd server
   npm install

2) Run tests

   npm test

Useful scripts:
- npm run test:watch   # watch mode
- npm run test:ci      # CI-friendly, runs in-band and silent

Notes:
- The server uses ESM TypeScript. Jest is configured via server/jest.config.cjs with ts-jest preset.
- Tests live under server/src/__tests__. The game logic is in server/src/game.ts.
- If you see "jest: not found", you likely skipped npm install in the server directory.
