let video;
let picture;
let scaledPicture;
let greyPicture;
let redChannel, greenChannel, blueChannel;
let segmentedImages = {
  rgb: null,
  hsv: null,
  ycbcr: null
};
let redThreshold, greenThreshold, blueThreshold;
let hsvImage;
let ycbcrImage;
let faceapi;
let detections;

let currentFaceModification = 'original';
let hasTakenPicture = false;
let hasapplyEffectToFace = false;

let outimage;

// by default all options are set to true
const detectionOptions = {
  withLandmarks: true,
  withDescriptors: false,
};

function setup() {
  createCanvas(640 * 2, 680);
  video = createCapture(VIDEO);
  video.hide();

  // Initialize faceapi
  faceapi = ml5.faceApi(detectionOptions, modelReady);

  // Create a button element
  const captureButton = createButton('Capture Image');
  captureButton.id('captureButton');
  captureButton.mousePressed(takePicture);

  let redSliderText = createP('Red');
  let greenSliderText = createP('Green');
  let blueSliderText = createP('Blue');

  // Create sliders for threshold control
  redThreshold = createSlider(0, 255, 128);
  redSliderText.position(139, 700, 130);

  greenThreshold = createSlider(0, 255, 128);
  greenSliderText.position(270, 700, 130);

  blueThreshold = createSlider(0, 255, 128);
  blueSliderText.position(419, 700, 130);
}

function keyTyped() {
  // Change the currentFaceModification based on key press
  switch (key) {
    case '1':
      currentFaceModification = 'greyscale';
      break;
    case '2':
      currentFaceModification = 'blurred';
      break;
    case '3':
      currentFaceModification = 'colorConverted';
      break;
    case '4':
      currentFaceModification = 'pixelate';
      break;
  }
}


function draw() {
  background(255);

  // Display the webcam image in the grid at the position titled "Webcam image"
  image(video, 0, 0, 160, 120);

  if (picture) {
    // Display the greyscale version
    image(greyPicture, 200, 0, 160, 120);

    // Perform segmentation with individual channel thresholds
    let segmentedImages = segmentImageSliders(scaledPicture, redThreshold.value(), greenThreshold.value(), blueThreshold.value());

    // Display the R, G, B channels with threshold control
    image(redChannel, 0, 140, 160, 120);
    image(greenChannel, 200, 140, 160, 120);
    image(blueChannel, 400, 140, 160, 120);

    // Display the segmented images for R, G, B channels
    image(segmentedImages.red, 0, 280, 160, 120);
    image(segmentedImages.green, 200, 280, 160, 120);
    image(segmentedImages.blue, 400, 280, 160, 120);

    // Display the original image
    image(scaledPicture, 0, 420, 160, 120);

    // Display the HSV image if defined
    if (hsvImage) {
      image(hsvImage, 200, 420, 160, 120);    
    }
    // Display the YCbCr image if defined
    if (ycbcrImage) {
      image(ycbcrImage, 400, 420, 160, 120);
    }

    // Display the original image
    image(scaledPicture, 0, 560, 160, 120);

    // Display face detection results
    drawBox(detections, 0, 560);

    applyEffectToFace(currentFaceModification, detections, 200, 560);
  
  }
}

function takePicture() {
  // Take a picture when the button is clicked
  picture = video.get();

  // Scale the picture to 160 x 120 pixels
  scaledPicture = picture.get();
  scaledPicture.resize(160, 120);

  // Create a greyscale version with increased brightness
  greyPicture = createGreyscaleImage(picture);

  // Split the scaled picture into R, G, B channels
  redChannel = extractChannelImage(scaledPicture, 'red');
  greenChannel = extractChannelImage(scaledPicture, 'green');
  blueChannel = extractChannelImage(scaledPicture, 'blue');

  // Convert to HSV color space
  hsvImage = rgbToHsv(scaledPicture);

  // Convert to YCbCr color space
  ycbcrImage = rgbToYCbCr(redChannel);

  // Perform face detection on the specified image
  faceapi.detectSingle(scaledPicture, gotResults);
  hasTakenPicture = true;
}

function createGreyscaleImage(src) {
  let greyImage = src.get();
  greyImage.loadPixels();

  for (let i = 0; i < greyImage.pixels.length; i += 4) {
    let r = greyImage.pixels[i];
    let g = greyImage.pixels[i + 1];
    let b = greyImage.pixels[i + 2];

    // Convert to grayscale using luminosity method
    let grayValue = 0.299 * r + 0.587 * g + 0.114 * b;

    // Increase brightness by 20% and prevent pixel intensity
    let increasedBrightness = constrain(grayValue * 1.2, 0, 255);

    // Assign the new value
    greyImage.pixels[i] = increasedBrightness;
    greyImage.pixels[i + 1] = increasedBrightness;
    greyImage.pixels[i + 2] = increasedBrightness;
  }

  greyImage.updatePixels();
  return greyImage;
}

function extractChannelImage(img, channel) {
  let extractedChannel = img.get();
  extractedChannel.loadPixels();
  for (let i = 0; i < extractedChannel.pixels.length; i += 4) {

    if (channel === 'red') {
      extractedChannel.pixels[i + 1] = 0;
      extractedChannel.pixels[i + 2] = 0;
    } else if (channel === 'green') {
      extractedChannel.pixels[i] = 0;
      extractedChannel.pixels[i + 2] = 0;
    } else if (channel === 'blue') {
      extractedChannel.pixels[i] = 0;
      extractedChannel.pixels[i + 1] = 0;
    }
  }
  extractedChannel.updatePixels();
  return extractedChannel;
}

function rgbToHsv(src) {
  let hsv = createImage(src.width, src.height);
  hsv.loadPixels();

  for (let x = 0; x < src.width; x++) {
    for (let y = 0; y < src.height; y++) {
      let c = src.get(x, y);
      let hsb = rgbToHsb(red(c), green(c), blue(c));
      let index = (x + y * hsv.width) * 4;
      hsv.pixels[index] = hsb[0];
      hsv.pixels[index + 1] = hsb[1];
      hsv.pixels[index + 2] = hsb[2];
      hsv.pixels[index + 3] = alpha(c); // Alpha value
    }
  }
  hsv.updatePixels();
  return hsv;
}

function rgbToYCbCr(src) {
  let ycbcr = createImage(src.width, src.height);
  ycbcr.loadPixels();

  for (let x = 0; x < src.width; x++) {
    for (let y = 0; y < src.height; y++) {
      let c = src.get(x, y);
      let ycbcrValues = rgbToYCbCrValues(red(c), green(c), blue(c));
      let index = (x + y * ycbcr.width) * 4;
      ycbcr.pixels[index] = ycbcrValues[0];
      ycbcr.pixels[index + 1] = ycbcrValues[1];
      ycbcr.pixels[index + 2] = ycbcrValues[2];
      ycbcr.pixels[index + 3] = alpha(c); // Alpha value
    }
  }
  ycbcr.updatePixels();
  return ycbcr;
}

function rgbToHsb(r, g, b) {
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h, s, v = max;

  let d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, v];
}

function rgbToYCbCrValues(r, g, b) {
  let y = 0.299 * r + 0.587 * g + 0.114 * b;
  let cb = 0.564 * (b - y);
  let cr = 0.713 * (r - y);

  return [y, cb, cr];
}

function segmentImageSliders(src, redThreshold, greenThreshold, blueThreshold) {
  let segmentedRedImage = createImage(src.width, src.height);
  let segmentedGreenImage = createImage(src.width, src.height);
  let segmentedBlueImage = createImage(src.width, src.height);

  segmentedRedImage.loadPixels();
  segmentedGreenImage.loadPixels();
  segmentedBlueImage.loadPixels();

  for (let x = 0; x < src.width; x++) {
    for (let y = 0; y < src.height; y++) {
      let c = src.get(x, y);
      let redValue = red(c);
      let greenValue = green(c);
      let blueValue = blue(c);

      let segmentedRedValue = redValue > redThreshold ? 255 : 0;
      let segmentedGreenValue = greenValue > greenThreshold ? 255 : 0;
      let segmentedBlueValue = blueValue > blueThreshold ? 255 : 0;

      let index = (x + y * src.width) * 4;

      // Segmented Red channel
      segmentedRedImage.pixels[index] = segmentedRedValue;
      segmentedRedImage.pixels[index + 1] = 0;
      segmentedRedImage.pixels[index + 2] = 0;
      segmentedRedImage.pixels[index + 3] = alpha(c);

      // Segmented Green channel
      segmentedGreenImage.pixels[index] = 0;
      segmentedGreenImage.pixels[index + 1] = segmentedGreenValue;
      segmentedGreenImage.pixels[index + 2] = 0;
      segmentedGreenImage.pixels[index + 3] = alpha(c);

      // Segmented Blue channel
      segmentedBlueImage.pixels[index] = 0;
      segmentedBlueImage.pixels[index + 1] = 0;
      segmentedBlueImage.pixels[index + 2] = segmentedBlueValue;
      segmentedBlueImage.pixels[index + 3] = alpha(c);
    }
  }

  segmentedRedImage.updatePixels();
  segmentedGreenImage.updatePixels();
  segmentedBlueImage.updatePixels();

  return {
    red: segmentedRedImage,
    green: segmentedGreenImage,
    blue: segmentedBlueImage
  };
}
function modelReady() {
  console.log("Face detection model ready!");
}


function gotResults(err, result) {
  if (err) {
    console.log(err);
    return;
  }
  console.log(typeof result)
  detections = result;
  if (detections) {
      // Draw face detection on the specified area of the canvas
      drawBox(detections, 0, 560, 160, 120);
    
  }
}

function drawBox(detections, offsetX, offsetY) {
  if (detections) {
    const alignedRect = detections.alignedRect;
    const { _x, _y, _width, _height } = alignedRect._box;

    noFill();
    stroke(161, 95, 251);
    strokeWeight(2);
    rect(_x + offsetX, _y + offsetY, _width, _height);
  }
}

function applyEffectToFace(effect, detections, offsetX, offsetY) {
  if (hasapplyEffectToFace) {
    console.log("Effect has already been applied. Skipping...");
    return;
  }
  if (detections) {
    const alignedRect = detections.alignedRect;
    const { _x, _y, _width, _height } = alignedRect._box;
    // Initialize outimage before using it
    outimage = createImage(_width, _height);
    let faceImage;

    switch (effect) {
      case 'greyscale':
        console.log('greyscale');
        faceImage = createGreyscaleImage(scaledPicture.get(_x, _y, _width, _height));
        break;
      case 'blurred':
        console.log('blurred');
        let blurredImage = scaledPicture.get(_x, _y, _width, _height);
        blurredImage.filter(BLUR, 15);
        faceImage = blurredImage;
        break;
      case 'colorConverted':
        console.log('colorConverted');
        if (currentFaceModification === 'colorConverted') {
          faceImage = hsvImage.get(_x, _y, _width, _height);
        }
        break;
      case 'pixelate':
        if (effect === 'pixelate') {
          applyPixelationToFace(faceImage,offsetX, offsetY);
          
        }
        break;
      default:
        // Use the entire face region without specifying dimensions
        faceImage = scaledPicture.get(_x, _y, _width, _height);
    }

      console.log("x + offsetX:", _x + offsetX);
      console.log("y + offsetY:", _y + offsetY);
      console.log("width:", _width);
      console.log("height:", _height);
    
    image(faceImage, _x + offsetX, _y + offsetY, _width, _height);
    
  }
}

function applyPixelationToFace(faceImage, offsetX, offsetY) {
  // Ensure we have a grayscale image for pixelation
  faceImage = createGreyscaleImage(scaledPicture);

  // Create a new image for the pixelated version
  const pixelatedImage = createImage(faceImage.width, faceImage.height);
  pixelatedImage.loadPixels();

  // Calculate the block size based on desired effect
  const blockSize = 5;

  // Loop through each block
  for (let y = 0; y < faceImage.height; y += blockSize) {
    for (let x = 0; x < faceImage.width; x += blockSize) {
      // Calculate average pixel intensity
      let totalRed = 0;
      let totalGreen = 0;
      let totalBlue = 0;
      let numPixels = 0;

      for (let blockY = 0; blockY < blockSize; blockY++) {
        for (let blockX = 0; blockX < blockSize; blockX++) {
          const currentX = x + blockX;
          const currentY = y + blockY;

          if (currentX < faceImage.width && currentY < faceImage.height) {
            const pixelIndex = (currentX + currentY * faceImage.width) * 4;
            totalRed += faceImage.pixels[pixelIndex];
            totalGreen += faceImage.pixels[pixelIndex + 1];
            totalBlue += faceImage.pixels[pixelIndex + 2];
            numPixels++;
          }
        }
      }

      const averageRed = totalRed / numPixels;
      const averageGreen = totalGreen / numPixels;
      const averageBlue = totalBlue / numPixels;

      // Apply average color to all pixels in the block
      for (let blockY = 0; blockY < blockSize; blockY++) {
        for (let blockX = 0; blockX < blockSize; blockX++) {
          const currentX = x + blockX;
          const currentY = y + blockY;

          if (currentX < pixelatedImage.width && currentY < pixelatedImage.height) {
            const pixelIndex = (currentX + currentY * pixelatedImage.width) * 4;
            pixelatedImage.pixels[pixelIndex] = averageRed;
            pixelatedImage.pixels[pixelIndex + 1] = averageGreen;
            pixelatedImage.pixels[pixelIndex + 2] = averageBlue;
            pixelatedImage.pixels[pixelIndex + 3] = 255; // Maintain opacity
          }
        }
      }
    }
  }

  pixelatedImage.updatePixels();

  // Draw the pixelated face on the canvas
  image(pixelatedImage, offsetX, offsetY, faceImage.width, faceImage.height);
}