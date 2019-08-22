import React from 'react';

// Clock component based on example from BCA lecture slides
class Clock extends React.Component {
  constructor(props) {
    super(props);
    this.state = {time: new Date()};
    props.setWelcomeMessage(this.state.time.toLocaleTimeString());
  }

  componentDidMount() {
    this.timerID = setInterval(
      () => this.tick(),
      1000
    );
    this.messageID = setInterval(
      () => this.props.setWelcomeMessage(), 3600000
    );
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  tick() {
    this.setState({
      time: new Date()
    });
  }

  // render clock to screen
  render() {
    return (
      <div>
        <p>{this.props.currentDate}</p>
        <p id="time">{this.state.time.toLocaleTimeString()}</p>
      </div>
    );
  }
}

export default Clock;