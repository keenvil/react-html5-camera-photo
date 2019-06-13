import React from 'react';
import PropTypes from 'prop-types';

import './styles/circleButton.css';

export const CircleButton = ({ onClick, isClicked }) => {
  const innerCircleClasses = isClicked ? 'fa fa-times' : 'fa fa-camera';
  return (
    <div id="container-circles">
      <div
        id="outer-circle"
        onClick = {
          (e) => {
            onClick();
          }
        }
      >
        <i className={innerCircleClasses} aria-hidden="true" />
      </div>
    </div>
  );
};

CircleButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  isClicked: PropTypes.bool.isRequired
};

export default CircleButton;
