import React from 'react';

import waterpump from './imgs/water-pump.svg';
import waterpumpon from './imgs/water-pump-on.svg';
import altwaterpump from './imgs/alt-water-pump.svg';
import altwaterpumpoff from './imgs/alt-water-pump-off.svg';
import wind from './imgs/wind.svg';
import drop from './imgs/drop.svg';
import dropborder from './imgs/drop_border.svg';
import bulbOn from './imgs/bulb_on.svg';
import bulbOff from './imgs/bulb_off.svg';

class Dashboard extends React.Component {
  constructor(props) {
    super(props);
  }

  
  render() {
    console.log({'message props':this.props.messages});
    return (
      <div id="dash">
        {/* <div id="topNav">
          <ul id="navItems">
            <li>Air</li>
            <li>Water</li>
            <li>Light</li>
          </ul>
        </div> */}

        <div id="air-content">
          {/* <div className="label">Air:</div>  */}
          <div id="air-img-box">
            <img src={wind} width="120px" height="120px" alt="" />
          </div>
          <div id="air-container">
            <div className="data">{this.props.airAvgs.temperature}&#176;F
              <div className="label">Temperature</div>
            </div>
            <div className="data secondary">{this.props.airAvgs.humidity}%
              <div className="label">Humidity</div>
            </div>
          </div>
        </div>
        
        <div id="water-content">
          <div id="water-img-box">
              <img src={dropborder} width="120px" height="120px" alt=""/>
          </div>
          <div id="water-container">
            <div className="data">{this.props.waterAvgs.temperature}&#176;F
              <div className="label">Temperature</div>
            </div>
            <div className="data secondary"> {this.props.waterAvgs.level}
              <div className="label">Level</div>
            </div>
          </div>
        </div>

        <div id="light-content">
          <div id="light-img-box">
            { (this.props.lightStatus === "ON") &&
              <img src={bulbOn} width="120px" height="120px" alt=""/>
            }
            { (this.props.lightStatus === "OFF") &&
              <img src={bulbOff} width="120px" height="120px" alt=""/>
            }
          </div>
          <div id="light-text">
            <strong>Lights</strong>
            <br/>
            {this.props.lightStatus}
          </div>
        </div>

        <div id="pump-content">
          <div id="pump-img-box">
            {/* <img src={waterpump} width="100px" height="100px" alt="water pump svg"/> */}
            { (this.props.pumpStatus === "ON") &&
              <img id="pumpon" src={altwaterpump} width="100px" height="100px" alt=""/>
            }
            { (this.props.pumpStatus === "OFF") &&
              <img src={altwaterpumpoff} width="100px" height="100px" alt=""/>
            }
          </div>
          <div id="pump-text">
            <strong>Water</strong>
            <br/>
            <strong>Pumps</strong>
            <br/>
            {this.props.pumpStatus}
          </div>
        </div>

        <div id="alert-content">
          Alert Log:
          <div id="alert-box">
            <ul id="message-list">
              {this.props.messages &&
                this.props.messages.map((message, index) => {
                  let messageClass = 'okay';
                  if(message.includes('Warning')) {
                    messageClass = 'warning';
                  }
                  if(message.includes('ALERT')) {
                    messageClass = 'alert';
                  }
                  return(
                    <li className={messageClass} key={index}>{message}</li>
                  );
              })}
            </ul>
          </div>
        </div>

        {/* <div id="control-content">Control</div> */}
      </div>);
  }
}

export default Dashboard;