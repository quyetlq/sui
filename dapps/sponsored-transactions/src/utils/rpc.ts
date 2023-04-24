// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { JsonRpcProvider, devnetConnection, testnetConnection } from '@mysten/sui.js';

export const provider = new JsonRpcProvider(devnetConnection);
