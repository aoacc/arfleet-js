# ArFleet Project

<!-- ![ArFleet Logo](https://docs.arfleet.io/img/logo.svg) -->


[https://arfleet.io](https://arfleet.io)


## Overview

ArFleet is a protocol designed to facilitate the purchase of time-limited data storage from permissionless peers, eliminating the requirement of a third-party for enforcement.

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or Yarn
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/aoacc/arfleet-js.git
   ```
2. Navigate to the backend directory and install dependencies:
   ```bash
   cd arfleet/backend
   npm install
   ```
3. Navigate to the frontend directory and install dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

Go back to the root directory and run:

```bash
./arfleet client
```

if you are a client.

Or,

```bash
./arfleet provider
```

if you are a provider.

When your client is running, you can use the `./arfleet client store <directory or file>` command to store your data.

Note: in the current version, the data is available publicly.

## Contributing

Contributions are welcome! Feel free to open an issue or a pull request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.