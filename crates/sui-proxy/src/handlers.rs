// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
use crate::admin::ReqwestClient;
use crate::consumer::{convert_to_remote_write, populate_labels, NodeMetric};
use crate::histogram_relay::HistogramRelay;
use crate::middleware::LenDelimProtobuf;
use crate::peers::SuiPeer;
use axum::{
    extract::{ConnectInfo, Extension},
    http::StatusCode,
};
use multiaddr::Multiaddr;
use std::net::SocketAddr;

/// Publish handler which receives metrics from nodes.  Nodes will call us at this endpoint
/// and we relay them to the upstream tsdb
///
/// Clients will receive a response after successfully relaying the metrics upstream
pub async fn publish_metrics(
    Extension(network): Extension<String>,
    Extension(client): Extension<ReqwestClient>,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    Extension(host): Extension<SuiPeer>,
    Extension(relay): Extension<HistogramRelay>,
    LenDelimProtobuf(data): LenDelimProtobuf,
) -> (StatusCode, &'static str) {
    let data = populate_labels(host.name, network, data);
    relay.submit(data.clone());
    convert_to_remote_write(
        client.clone(),
        NodeMetric {
            data,
            peer_addr: Multiaddr::from(addr.ip()),
            public_key: host.public_key,
        },
    )
    .await
}
