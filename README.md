<p align="center"><img width="25%" alt="Offline logo" src="https://github.com/user-attachments/assets/35c58da8-89ee-41c4-af27-884b86ee4834"></p>

<h1 align="center">Shopify Unlock (Offline Unlock)</h1>

> [!IMPORTANT]  
> Offline development has been stopped on July 2024 and the project is no longer maintained.

> [!NOTE]  
> This is the repository for **Shopify Unlock (Offline Unlock)**, our token-gating system on Shopify. This app plays a critical role in the Shopify integration within the Offline ecosystem.

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)

## Table of Contents

- [Overview](#overview)
- [Relationship to the Marketplace Repository](#relationship-to-the-marketplace-repository)
- [Quick Start](#quick-start)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Environment Configuration](#environment-configuration)
  - [Local Development](#local-development)
- [Authenticating and Querying Data](#authenticating-and-querying-data)
- [Deployment](#deployment)
- [Tech Stack](#tech-stack)
- [Troubleshooting](#troubleshooting)
- [Resources](#resources)
- [License](#license)

## ✨ Features

- 👛 **Web3 Wallet Integration**: Seamlessly connect via a web3 wallet using **Cometh Connect** for Single Sign-On (SSO), enabling smooth and secure wallet-based authentication.
- 🎯 **Dynamic Campaign Content Display**: Automatically fetch and showcase campaign-specific content—like text and images—tailored to users based on their engagement and wallet status.
- 🎨 **Customizable UI**: Enjoy a responsive and dynamic interface that adapts according to settings from the **Theme Block Extension**, fully integrated into Shopify product pages.
- 🔑 **Consistent Passkey/Wallet Access**: Maintain uninterrupted access to your user's passkey wallet across all "Offline Gate" integrations, ensuring a unified and seamless experience across platforms.
- 🌐 **Multi-Language Support**: Engage a global audience with support for multiple languages, providing localized experiences for users around the world.

## Overview

**Shopify Unlock (Offline Unlock)** is a **Remix** app that plays a critical role in the Shopify integration within the Offline ecosystem. It is deployed on **Render.com** and serves as a key interface for handling user interactions related to web3 wallet connections and campaign content delivery within Shopify stores.

## Relationship to the Marketplace Repository

- **NFT Minting and Retrieval**: Connects to the **Offline Marketplace** API to mint and retrieve NFT information. This integration is critical for creating and managing NFTs (like OF Keys and Stamps) that represent user interactions within the Shopify store.
- **Perk and Reward System**: The marketplace manages the backend for distributing perks such as discounts or rewards by leveraging the NFTs tied to user purchases and activity. These NFTs are tracked and managed in the marketplace, which provides the backend support for the campaigns running on the Shopify platform.

In essence, **Shopify Unlock** is the user-facing component that interacts with the NFT and campaign data housed within the **Offline Marketplace** repository, ensuring that NFTs are minted, managed, and perks linked to them are applied properly in Shopify stores for each customer.

## Quick Start

### Prerequisites

Before you begin, you'll need the following:

1. **Node.js**: [Download and install](https://nodejs.org/en/download/) it if you haven't already.
2. **Shopify Partner Account**: [Create an account](https://partners.shopify.com/signup) if you don't have one.
3. **Test Store**: Set up either a [development store](https://help.shopify.com/en/partners/dashboard/development-stores#create-a-development-store) or a [Shopify Plus sandbox store](https://help.shopify.com/en/partners/dashboard/managing-stores/plus-sandbox-store) for testing your app.
4. **Cometh Connect API Key**: Sign up for an account with [Cometh Connect](https://docs.cometh.io/connect) to obtain your API key.
5. **Offline Marketplace API Access**: Ensure you have access to the Offline Marketplace API for NFT minting and retrieval.

### Setup

Clone the repository:

```shell
git clone https://github.com/yourusername/shopify-unlock.git
cd shopify-unlock
```

Install dependencies using **pnpm**:

```shell
pnpm install
```

### Environment Configuration

Create a `.env` file in the root directory and provide the necessary environment variables:

```env
# Shopify API credentials
SHOPIFY_API_KEY=your_shopify_api_key
SHOPIFY_API_SECRET=your_shopify_api_secret

# Cometh Connect API key
COMETH_CONNECT_API_KEY=your_cometh_connect_api_key

# Offline Marketplace API
OFFLINE_MARKETPLACE_API_URL=https://api.offline.marketplace.com
OFFLINE_MARKETPLACE_API_KEY=your_offline_marketplace_api_key

# Session secret
SESSION_SECRET=your_session_secret

# Other necessary environment variables
# ...
```

### Local Development

Start the development server using **pnpm**:

```shell
pnpm dev
```

Press **P** to open the URL to your app. Once you click install, you can start development.

Local development is powered by the [Shopify CLI](https://shopify.dev/docs/apps/tools/cli). It logs into your partner account, connects to an app, provides environment variables, updates remote config, creates a tunnel, and provides commands to generate extensions.

## Authenticating and Querying Data

To authenticate and query data, you can use the `shopify` constant exported from `/app/shopify.server.js`:

```js
// Example loader function
export async function loader({ request }) {
  const { admin } = await shopify.authenticate.admin(request);

  const response = await admin.graphql(`
    {
      products(first: 25) {
        nodes {
          title
          description
        }
      }
    }`);

  const {
    data: {
      products: { nodes },
    },
  } = await response.json();

  return json(nodes);
}
```

This app comes preconfigured with examples of:

1. Setting up your Shopify app in `/app/shopify.server.js`
2. Querying data using GraphQL (see `/app/routes/app._index.jsx`)
3. Responding to mandatory webhooks in `/app/routes/webhooks.jsx`

For more details on the available APIs, refer to the [Shopify App Remix documentation](https://www.npmjs.com/package/@shopify/shopify-app-remix#authenticating-admin-requests).

## Deployment

- Our **Shopify Unlock** app is deployed using [Render.com](https://render.com/). When you're ready to deploy your app, follow Render.com's documentation for deploying a Remix app. We have a staging and production environment that you can find in the [staging render.yaml](./deploy/staging/render.yaml) and [production render.yaml](./deploy/production/render.yaml) files.
- The **theme block extensions and checkout functions** are deployed through our [GitHub Action](./.github/workflows/deploy-shopify-app.yml).

### Build

Remix handles building the app for you. Run the build command using **pnpm**:

```shell
pnpm build
```

### Environment Variables on Render.com

Ensure that all the necessary environment variables are set in your Render.com dashboard. This includes any API keys, database URLs, and other secrets required by your app.

### Application Storage

This app uses [Prisma](https://www.prisma.io/) for database interactions. By default, it uses SQLite for local development. For production, consider using a hosted database like PostgreSQL, MySQL, or MongoDB.

Update your `prisma/schema.prisma` and `.env` files accordingly.

## 🧰 Tech Stack

- **Remix**: For building the app's frontend and server-rendered components.
- **Shopify App Remix**: Provides authentication and methods for interacting with Shopify APIs.
- **Cometh Connect**: For web3 wallet integration and SSO functionality.
- **Render.com**: For deploying and hosting the app.
- **Prisma**: For database ORM.
- **Shopify Polaris**: For consistent UI components.
- **Shopify App Bridge**: For seamless integration within Shopify's Admin.
- **Web3 Technologies**: For blockchain interactions and NFT management.
- **pnpm**: As the package manager for faster and more efficient dependency management.

## Troubleshooting

### Database Tables Do Not Exist

If you encounter an error like:

```
The table `main.Session` does not exist in the current database.
```

You need to create the database tables for Prisma. Run the `setup` script using **pnpm**:

```shell
pnpm setup
```

### OAuth Loop After Changing Scopes

If you change your app's scopes and authentication goes into a loop, failing with a message from Shopify that it tried too many times, you might need to update your app's configuration on Shopify. Run the `deploy` command to update the app settings:

```shell
pnpm deploy
```

### Webhook Subscriptions Not Updating

This app registers webhooks after OAuth completes. If webhooks are not updating as expected, try uninstalling and reinstalling the app in your development store to force the OAuth process and trigger webhook registration.

### Issues with Web3 Wallet Connection

Ensure that your **Cometh Connect** API key is valid and that the integration is correctly set up. Refer to the [Cometh Connect Documentation](https://docs.cometh.io/connect) for troubleshooting tips.

## Resources

- [Remix Documentation](https://remix.run/docs/en/main#remix-docs)
- [Shopify App Remix](https://shopify.dev/docs/api/shopify-app-remix)
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
- [Cometh Connect Documentation](https://docs.cometh.io/connect)
- [Render.com Documentation](https://render.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Shopify Polaris](https://polaris.shopify.com/)
- [pnpm Documentation](https://pnpm.io/)

## License

This project is licensed under the **GNU General Public License v3.0** - see the [LICENSE](LICENSE) file for details.
