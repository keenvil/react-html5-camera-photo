import React from 'react';
import PropTypes from 'prop-types';

// for debugging with git cloned jslib-html5-camera-photo
// clone jslib-html5-camera-photo inside /src and replace
// from 'jslib-html5-camera-photo' -> from '../../../jslib-html5-camera-photo/src/lib';
import LibCameraPhoto, { FACING_MODES, IMAGE_TYPES } from 'jslib-html5-camera-photo';

import CircleButton from '../CircleButton';
import DisplayError from '../DisplayError';
import WhiteFlash from '../WhiteFlash';
import Counter from '../Counter';

import {getShowHideStyle,
  getVideoStyles,
  isDynamicPropsUpdate,
  playClickAudio,
  printCameraInfo} from './helpers';
import './styles/camera.css';

/*
Inspiration : https://www.html5rocks.com/en/tutorials/getusermedia/intro/
*/
class Camera extends React.Component {
  constructor (props, context) {
    super(props, context);
    this.libCameraPhoto = null;
    this.showVideoTimeoutId = null;
    this.videoRef = React.createRef();
    this.state = {
      dataUri: '',
      isShowVideo: true,
      isCameraStarted: false,
      startCameraErrorMsg: '',
      showCounter: false,
      showFlash: false
    };
    this.handleTakePhoto = this.handleTakePhoto.bind(this);
    this.clearShowVideoTimeout = this.clearShowVideoTimeout.bind(this);
    this.onCounterEnd = this.onCounterEnd.bind(this);
  }

  componentDidMount () {
    this.libCameraPhoto = new LibCameraPhoto(this.videoRef.current);
    const {idealFacingMode, idealResolution, isMaxResolution} = this.props;
    if (isMaxResolution) {
      this.startCameraMaxResolution(idealFacingMode);
    } else {
      this.startCameraIdealResolution(idealFacingMode, idealResolution);
    }
  }

  // eslint-disable-next-line
  UNSAFE_componentWillReceiveProps (nextProps) {
    if (isDynamicPropsUpdate(this.props, nextProps)) {
      const {idealFacingMode, idealResolution, isMaxResolution} = nextProps;
      this.restartCamera(idealFacingMode, idealResolution, isMaxResolution);
    }
  }

  componentWillUnmount () {
    this.clearShowVideoTimeout();
    const isComponentWillUnmount = true;
    this.stopCamera(isComponentWillUnmount)
      .catch((error) => {
        printCameraInfo(error.message);
      });
  }

  clearShowVideoTimeout () {
    if (this.showVideoTimeoutId) {
      clearTimeout(this.showVideoTimeoutId);
    }
  }

  restartCamera (idealFacingMode, idealResolution, isMaxResolution) {
    this.stopCamera()
      .then()
      .catch((error) => {
        printCameraInfo(error.message);
      })
      .then(() => {
        if (isMaxResolution) {
          this.startCameraMaxResolution(idealFacingMode);
        } else {
          this.startCameraIdealResolution(idealFacingMode, idealResolution);
        }
      });
  }

  startCamera (promiseStartCamera) {
    promiseStartCamera
      .then((stream) => {
        this.setState({
          isCameraStarted: true,
          startCameraErrorMsg: ''
        });
        if (typeof this.props.onCameraStart === 'function') {
          this.props.onCameraStart(stream);
        }
      })
      .catch((error) => {
        this.setState({startCameraErrorMsg: error.message});
        if (typeof this.props.onCameraError === 'function') {
          this.props.onCameraError(error);
        }
      });
  }

  startCameraIdealResolution (idealFacingMode, idealResolution) {
    let promiseStartCamera =
        this.libCameraPhoto.startCamera(idealFacingMode, idealResolution);
    this.startCamera(promiseStartCamera);
  }

  startCameraMaxResolution (idealFacingMode) {
    let promiseStartCamera =
        this.libCameraPhoto.startCameraMaxResolution(idealFacingMode);
    this.startCamera(promiseStartCamera);
  }

  stopCamera (isComponentWillUnmount = false) {
    return new Promise((resolve, reject) => {
      this.libCameraPhoto.stopCamera()
        .then(() => {
          if (!isComponentWillUnmount) {
            this.setState({ isCameraStarted: false });
          }
          if (typeof this.props.onCameraStop === 'function') {
            this.props.onCameraStop();
          }
          resolve();
        })
        .catch((error) => {
          if (typeof this.props.onCameraError === 'function') {
            this.props.onCameraError(error);
          }
          reject(error);
        });
    });
  }

  onCounterEnd () {
    this.setState({
      showCounter: false
    });

    if (this.props.onBeforeTakePhoto) {
      this.props.onBeforeTakePhoto();
    }

    const { sizeFactor, imageType, imageCompression, isImageMirror } = this.props;
    const configDataUri = { sizeFactor, imageType, imageCompression, isImageMirror };

    let dataUri = this.libCameraPhoto.getDataUri(configDataUri);
    this.props.onTakePhoto(dataUri);

    this.setState({
      dataUri,
      isShowVideo: false,
      showFlash: true
    });

    this.clearShowVideoTimeout();
    this.showVideoTimeoutId = setTimeout(() => {
      this.setState({
        showFlash: false
      });
    }, 500);
  }

  handleTakePhoto () {
    if (!this.state.isShowVideo) {
      this.setState({
        dataUri: '',
        isShowVideo: true,
        showFlash: false
      });
      return;
    }

    const { isSilentMode } = this.props;

    if (!isSilentMode) {
      playClickAudio();
    }

    this.setState({
      showCounter: true
    });
  }

  render () {
    const {isImageMirror, isDisplayStartCameraError, isFullscreen, counterStart} = this.props;

    let videoStyles = getVideoStyles(this.state.isShowVideo, isImageMirror);
    let showHideImgStyle = getShowHideStyle(!this.state.isShowVideo);
    const shouldShowCounter = this.state.showCounter;
    const shouldShowFlash = this.state.showFlash;

    let classNameFullscreen = isFullscreen ? 'react-html5-camera-photo-fullscreen' : '';
    return (
      <div className={'react-html5-camera-photo ' + classNameFullscreen}>
        <DisplayError
          cssClass={'display-error'}
          isDisplayError={isDisplayStartCameraError}
          errorMsg={this.state.startCameraErrorMsg}
        />
        <WhiteFlash
          isShowWhiteFlash={shouldShowFlash}
        />
        <img
          style={showHideImgStyle}
          alt="camera"
          src={this.state.dataUri}
        />
        <video
          style={videoStyles}
          ref={this.videoRef}
          autoPlay={true}
          muted="muted"
          playsInline
        />
        { !shouldShowCounter &&
          <CircleButton
            isClicked={!this.state.isShowVideo}
            onClick={this.handleTakePhoto}
          />
        }
        { shouldShowCounter &&
          <Counter
            onCounterEnd={this.onCounterEnd}
            start={counterStart}
            isVisible={shouldShowCounter}
          />
        }
      </div>
    );
  }
}

export {
  FACING_MODES,
  IMAGE_TYPES
};

export default Camera;

Camera.propTypes = {
  onTakePhoto: PropTypes.func.isRequired,
  onCameraError: PropTypes.func,
  idealFacingMode: PropTypes.string,
  idealResolution: PropTypes.object,
  imageType: PropTypes.string,
  isImageMirror: PropTypes.bool,
  isSilentMode: PropTypes.bool,
  isDisplayStartCameraError: PropTypes.bool,
  imageCompression: PropTypes.number,
  isMaxResolution: PropTypes.bool,
  isFullscreen: PropTypes.bool,
  sizeFactor: PropTypes.number,
  onCameraStart: PropTypes.func,
  onCameraStop: PropTypes.func,
  onBeforeTakePhoto: PropTypes.func,
  counterStart: PropTypes.number
};

Camera.defaultProps = {
  isImageMirror: true,
  isDisplayStartCameraError: true,
  counterStart: 3
};
