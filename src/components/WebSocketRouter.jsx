import React, { Component } from "react";
import { sleep, newTracyNotification } from "../utils";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";

class WebSocketRouter extends Component {
  componentDidMount = () => {
    this.connectToWebSocket();
  };

  disconnect = () => {
    this.ws.onclose = null;
    this.ws.close();
    this.ws = null;
    this.props.webSocketDisconnected();
  };

  componentWillUnmount = () => {
    this.disconnect();
  };

  connectToWebSocket = () => {
    this.ws = new WebSocket(
      `ws://${this.props.tracyHost}:${this.props.tracyPort}/ws`
    );

    this.ws.onmessage = msg => {
      const data = JSON.parse(msg.data);
      switch (Object.keys(data)[0]) {
        case "Tracer":
          this.props.handleNewTracer(data);
          break;
        case "Request":
          this.props.handleNewRequest(data);
          break;
        case "TracerEvent":
          this.props.handleNewEvent(data);
          break;
        case "Notification":
          const n = data.Notification;
          n.Event.DOMContexts.map(c => {
            if (c.Severity >= 2) {
              newTracyNotification(n.Tracer, c, n.Event);
              return true;
            }
            return false;
          });

          break;
        default:
          break;
      }
    };

    this.ws.onopen = () => {
      this.props.webSocketConnected();
    };

    this.ws.onclose = () => {
      this.disconnect();
      sleep(1500);
      this.connectToWebSocket();
    };
  };

  ws = null;
  spinner = <FontAwesomeIcon className="spinner" icon="spinner" />;
  check = <FontAwesomeIcon className="check" icon="check" />;

  render = () => {
    if (this.props.isOpen && this.ws && this.props.apiKey) {
      // If we have a websocket connection, send a subscription notice
      // which channel we want to receive events for.
      console.log("[WEBSOCKET-OUT]", JSON.stringify([this.props.apiKey]));
      this.ws.send(JSON.stringify([this.props.apiKey]));
      return <div title="websocket connected">{this.check}</div>;
    }

    return (
      <div title="websocketed disconnected. retrying...">{this.spinner}</div>
    );
  };
}

export default WebSocketRouter;
