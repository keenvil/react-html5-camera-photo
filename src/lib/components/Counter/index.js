import React, {Component} from 'react';
import PropTypes from 'prop-types';
import posed from 'react-pose';

import './styles.css';

const Step = posed.div({
  active: { opacity: 1 },
  inactive: { opacity: 0.4 }
});

class Counter extends Component {
  constructor (props) {
    super(props);
    this.state = {};
  }

  componentDidMount () {
    this.setState({
      start: this.props.start,
      currentStep: this.props.start
    });

    const interval = setInterval(() => {
      let step = this.state.currentStep - 1;

      this.setState({
        currentStep: step
      });

      if (step < 0) {
        clearInterval(interval);
        this.props.onCounterEnd();
      }
    }, 600);
  }

  render () {
    const items = [];

    for (let i = this.props.start; i > 0; i--) {
      items.push(<Step key={i} className="counter__step" pose={this.state.currentStep === i ? 'active' : 'inactive'}>{i}</Step>);
    }

    return (
      <div className="counter">
        { items }
        <Step key="camera" className="counter__step" pose={this.state.currentStep === 0 ? 'active' : 'inactive'}>
          <i className="fa fa-camera" aria-hidden="true"></i>
        </Step>
      </div>
    );
  }
}

Counter.propTypes = {
  start: PropTypes.number,
  onCounterEnd: PropTypes.func,
  isVisible: PropTypes.bool
};

export default Counter;
