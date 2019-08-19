import React from 'react';

class Clock extends React.Component {
  constructor(props) {
    super(props);
  
  }

  componentDidMount() {
    this.timerID = setInterval(
      () => this.props.tick(),
      1000
    );
  }

  componentWillUnmount() {
    clearInterval(this.timerID);
  }

  render() {
    return (
      <div>
        <p>{this.props.currentDate}</p>
        <p>{this.props.time.toLocaleTimeString()}</p>
      </div>
    );
  }
}

export default Clock;