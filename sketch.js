// Declare variables for video, pictures, channels, and segmented images
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

// Declare threshold values for segmentation
let redThreshold, greenThreshold, blueThreshold;

// Declare images for HSV and YCbCr color spaces
let hsvImage;
let ycbcrImage;
let segmentedHsvImage;
let segmentedYcbcrImage;

// Initialize faceapi and face detection results
let faceapi;
let detections;

// Track the current face modification and capture status
let currentFaceModification = 'original';

let hasTakenPicture = false;
let hasapplyEffectToFace = false;

// Declare a variable to store the selected grayscale effect
let selectedGrayscaleEffect = 'original';
let liveForExtension = false;

// Define face detection options
const detectionOptions = {
  withLandmarks: true,
  withDescriptors: false,
};

// Setup function for initializing the canvas, video, and faceapi
function setup() {
  createCanvas(840 * 2, 680);
  video = createCapture(VIDEO);
  video.hide();

  faceapi = ml5.faceApi(detectionOptions, modelReady);

  // Create a button to take snapshot
  const captureButton = createButton('Capture Image');
  captureButton.position(0, 116)
  captureButton.id('captureButton');
  captureButton.mousePressed(takePicture);

  // Create red, green, blue sliders and define the positions
  redThreshold = createSlider(0, 255, 128);
  redThreshold.position(0, 230 + 120 + 40);

  greenThreshold = createSlider(0, 255, 128);
  greenThreshold.position(200, 230 + 120 + 40);

  blueThreshold = createSlider(0, 255, 128);
  blueThreshold.position(400, 230 + 120 + 40);

}

// Handle key presses to change face modification effect
function keyTyped() {
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
  // Display the webcam image
  image(video, 0, 0, 160, 120);

  if (picture) {
    // Display the greyscale version
    image(greyPicture, 200, 0, 160, 120);

    // Perform segmentation with individual channel thresholds
    let segmentedImages = segmentImageSliders(scaledPicture, redThreshold.value(), greenThreshold.value(), blueThreshold.value());

    // Display image from the R, G, B channels with threshold control
    image(redChannel, 0, 140, 160, 120);
    image(greenChannel, 200, 140, 160, 120);
    image(blueChannel, 400, 140, 160, 120);

    // Display the segmented images for R, G, B channels
    image(segmentedImages.red, 0, 280, 160, 120);
    image(segmentedImages.green, 200, 280, 160, 120);
    image(segmentedImages.blue, 400, 280, 160, 120);

    // Display the original image
    image(scaledPicture, 0, 420, 160, 120);
    // Display the color conversion(HSV) and segmented HSV image
    if (hsvImage) {
      image(hsvImage, 200, 420, 160, 120);

      // Perform segmentation on the HSV image
      let segmentedHsvImage = segmentImageHSV(hsvImage);
      image(segmentedHsvImage, 200, 560, 160, 120);
    }
    // Display the YCbCr image and Segmented YcbCr image
    if (ycbcrImage) {
      image(ycbcrImage, 400, 420, 160, 120);

      // Perform segmentation on the YCbCr image
      let segmentedYcbcrImage = segmentImageYCbCr(ycbcrImage);
      image(segmentedYcbcrImage, 400, 560, 160, 120);
    }

    // Display the original image
    image(video, 0, 560, 160, 120);
    // Display face detection results
    drawBox(detections, 0, 560);

    // Apply selected effect to face
    applyEffectToFace(currentFaceModification, detections, 0, 560);
  }

  // Call extensionLive to display live video with selected grayscale effect
  extensionLive();
}

// Function to capture a picture from the webcam
function takePicture() {
  capturing = true;
  liveForExtension = false; // Reset the flag for other cases
  // Capture a still frame from the webcam and store it in 'picture'
  picture = video.get();
  // Create a copy of the captured image 
  scaledPicture = picture.get();
  // Resize the copy to a (160x120) as the requirements
  scaledPicture.resize(160, 120);
  // Create a grayscale version
  greyPicture = createGreyscaleImage(picture);
  // Extract redd, blue, green channel images
  redChannel = extractChannelImage(scaledPicture, 'red');
  greenChannel = extractChannelImage(scaledPicture, 'green');
  blueChannel = extractChannelImage(scaledPicture, 'blue');

  // Convert the scaledPicture to HSV and YcbCr color space
  hsvImage = rgbToHsv(scaledPicture);
  ycbcrImage = rgbToYCbCr(redChannel);

  // Initiate face detection on the picture and call gotResults when is complete
  faceapi.detectSingle(scaledPicture, gotResults);
  // Set a flag
  hasTakenPicture = true;
  // video = createCapture(VIDEO);
  // video.hide();
}
function extensionLive() {
  // Create a dropdown menu to select grayscale effect
  const dropdown = createSelect();
  dropdown.position(400, 116);
  dropdown.id('grayscaleDropdown');
  dropdown.option('Original');
  dropdown.option('Grayscale');
  dropdown.option('RedChannel');
  dropdown.option('BlueChannel');
  dropdown.option('GreenChannel');
  // dropdown.option('Segmented HSV');
  // dropdown.option('Segmented HSV');

  // Event listener to update the selected grayscale effect
  dropdown.changed(() => {
    selectedGrayscaleEffect = dropdown.value();
    liveForExtension = true; // Set the flag to true when the dropdown changes
  });

  // Handle the selected grayscale effect for live video
  if (liveForExtension) {
    switch (selectedGrayscaleEffect) {
      case 'Original':
        image(video, 400, 0, 160, 120);
        break;
      case 'Grayscale':
        image(createGreyscaleImage(video), 400, 0, 160, 120);
        break;
        case 'RedChannel':
          image(extractChannelImage(video, 'red'), 400, 0, 160, 120);
          break;
        case 'BlueChannel':
          image(extractChannelImage(video, 'blue'), 400, 0, 160, 120);
          break;
        case 'GreenChannel':
          image(extractChannelImage(video, 'green'), 400, 0, 160, 120);
          break;
      default:
        image(video, 400, 0, 160, 120);
    }
  }
}
// Function to create a greyscale image with increased brightness
function createGreyscaleImage(src) {
  // Create a copy of the source image
  let greyImage = src.get();
  greyImage.loadPixels();

  // Get the red value of the current pixel and green, blue value
  for (let i = 0; i < greyImage.pixels.length; i += 4) {
    let r = greyImage.pixels[i];
    let g = greyImage.pixels[i + 1];
    let b = greyImage.pixels[i + 2];
    // Calculate weighted average for grayscale conversion
    let grayValue = 0.299 * r + 0.587 * g + 0.114 * b;
    // Increase brightness
    let increasedBrightness = constrain(grayValue * 1.2, 0, 255);
    // Set the new grayscale value
    greyImage.pixels[i] = increasedBrightness;
    greyImage.pixels[i + 1] = increasedBrightness;
    greyImage.pixels[i + 2] = increasedBrightness;
  }

  greyImage.updatePixels();
  return greyImage;
}

// Function to extract a specific color channel from an image
function extractChannelImage(img, channel) {
  let extractedChannel = img.get();
  extractedChannel.loadPixels();

  // Iterate through Pixels, the loop goes through every pixel in the image 
  for (let i = 0; i < extractedChannel.pixels.length; i += 4) {
    // Checks which color channel (red, green, or blue) is requested
    // For the unselected, the corresponding pixel values in the extractedChannel's pixel array are set to 0
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

  // Update and return
  extractedChannel.updatePixels();
  return extractedChannel;
}

// Function to convert an RGB image to HSV color space
function rgbToHsv(src) {
  let hsv = createImage(src.width, src.height);
  hsv.loadPixels();

  // Use nested loops to go through each pixel in the source (RGB) image
  for (let x = 0; x < src.width; x++) {
    for (let y = 0; y < src.height; y++) {
      // Get the color (R, G, B, alpha) of the pixel
      let c = src.get(x, y);
      // Convert RGB values to HSV using a helper rgbToHsb function
      let hsb = rgbToHsb(red(c), green(c), blue(c));
      // Calculate the index in the pixel array
      let index = (x + y * hsv.width) * 4;
      // Assign HSV values to the corresponding pixel in the HSV image
      hsv.pixels[index] = hsb[0];
      hsv.pixels[index + 1] = hsb[1];
      hsv.pixels[index + 2] = hsb[2];
      hsv.pixels[index + 3] = alpha(c);
    }
  }

  hsv.updatePixels();
  return hsv;
}

// Function to convert an RGB image to YCbCr color space
function rgbToYCbCr(src) {
  let ycbcr = createImage(src.width, src.height);
  ycbcr.loadPixels();

  for (let x = 0; x < src.width; x++) {
    for (let y = 0; y < src.height; y++) {
      // Get the color (R, G, B, alpha) of the pixel
      let c = src.get(x, y);
      // Convert RGB values to HSV using a helper rgbToYCbCrValues function
      let ycbcrValues = rgbToYCbCrValues(red(c), green(c), blue(c));
      // Calculate the index in the pixel array
      let index = (x + y * ycbcr.width) * 4;
      // Assign YcbCr values to the corresponding pixel in the YcbCr image
      ycbcr.pixels[index] = ycbcrValues[0];
      ycbcr.pixels[index + 1] = ycbcrValues[1];
      ycbcr.pixels[index + 2] = ycbcrValues[2];
      ycbcr.pixels[index + 3] = alpha(c);
    }
  }

  ycbcr.updatePixels();
  return ycbcr;
}

// Function to convert RGB to HSB values
function rgbToHsb(r, g, b) {
  // Find Max and Min values among the red, green, and blue components
  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  // Initialize 'v' (brightness) to the maximum value
  let h, s, v = max;
  // Calculate the difference between max and min and saturation
  let d = max - min;
  s = max === 0 ? 0 : d / max;

  // If max-min = hue is 0(no color, or greyscale), otherwhise calculates the hue accordingly
  if (max === min) {
    h = 0;
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

// Function to convert RGB to YCbCr values
function rgbToYCbCrValues(r, g, b) {
  // Calculate Y (luma/brightness), blue and red 
  let y = 0.299 * r + 0.587 * g + 0.114 * b;
  let cb = 0.564 * (b - y);
  let cr = 0.713 * (r - y);

  return [y, cb, cr];
}

// Function to segment an image based on slider thresholds
function segmentImageSliders(src, redThreshold, greenThreshold, blueThreshold) {
  // Create images for segmented channels
  let segmentedRedImage = createImage(src.width, src.height);
  let segmentedGreenImage = createImage(src.width, src.height);
  let segmentedBlueImage = createImage(src.width, src.height);
  // Load pixel data for manipulation
  segmentedRedImage.loadPixels();
  segmentedGreenImage.loadPixels();
  segmentedBlueImage.loadPixels();
  
  // Uses nested loops to iterate over every pixel in the source image
  for (let x = 0; x < src.width; x++) {
    for (let y = 0; y < src.height; y++) {
      let c = src.get(x, y);
      let redValue = red(c);
      let greenValue = green(c);
      let blueValue = blue(c);

      // Segmentation logic for the threshold comparison
      let segmentedRedValue = redValue > redThreshold ? 255 : 0;
      let segmentedGreenValue = greenValue > greenThreshold ? 255 : 0;
      let segmentedBlueValue = blueValue > blueThreshold ? 255 : 0;

      // Calculate index for modifying pixel arrays
      let index = (x + y * src.width) * 4;

      // Set pixels in segmented images based on thresholds
      segmentedRedImage.pixels[index] = segmentedRedValue;
      segmentedRedImage.pixels[index + 1] = 0;
      segmentedRedImage.pixels[index + 2] = 0;
      segmentedRedImage.pixels[index + 3] = alpha(c);

      segmentedGreenImage.pixels[index] = 0;
      segmentedGreenImage.pixels[index + 1] = segmentedGreenValue;
      segmentedGreenImage.pixels[index + 2] = 0;
      segmentedGreenImage.pixels[index + 3] = alpha(c);

      segmentedBlueImage.pixels[index] = 0;
      segmentedBlueImage.pixels[index + 1] = 0;
      segmentedBlueImage.pixels[index + 2] = segmentedBlueValue;
      segmentedBlueImage.pixels[index + 3] = alpha(c);
    }
  }

  // Update the images with the modified data
  segmentedRedImage.updatePixels();
  segmentedGreenImage.updatePixels();
  segmentedBlueImage.updatePixels();

  // Return all three segmented images
  return {
    red: segmentedRedImage,
    green: segmentedGreenImage,
    blue: segmentedBlueImage
  };
}

// Image segmentation based on ranges of values in the HSV 
function segmentImageHSV(src) {
  let segmentedImage = createImage(src.width, src.height);
  segmentedImage.loadPixels();

  // Iterates through each pixel of the source image
  for (let x = 0; x < src.width; x++) {
    for (let y = 0; y < src.height; y++) {
       // Calculate pixel array
      let index = (x + y * src.width) * 4;
      // Calculate HSV values
      let hueValue =src.pixels[index];
      let saturationValue = src.pixels[index + 1];
      let brightnessValue = src.pixels[index + 2];

      // Defines the ranges for hue, saturation, and value
      let isSegmented = (hueValue >= 0 && hueValue <= 200) && 
                        (saturationValue >= 0 && saturationValue <= 255) && 
                        (brightnessValue >= 0 && brightnessValue <= 255);

      // Checks if the current pixel's HSV values fall within the specified ranges
      let segmentedPixelValue = isSegmented ? 255 : 0;
      // Set segmented pixel values (grayscale)
      segmentedImage.pixels[index] = segmentedPixelValue;
      segmentedImage.pixels[index + 1] = segmentedPixelValue;
      segmentedImage.pixels[index + 2] = segmentedPixelValue;
      segmentedImage.pixels[index + 3] = src.pixels[index + 3]; // Alpha 
    }
  }
  segmentedImage.updatePixels();
  return segmentedImage;
}

// Image segmentation based on ranges of values in the YcbCr
function segmentImageYCbCr(src) {
  let segmentedImage = createImage(src.width, src.height);
  segmentedImage.loadPixels();

  // Iterates through each pixel of the source image
  for (let x = 0; x < src.width; x++) {
    for (let y = 0; y < src.height; y++) {
      // Calculate pixel array
      let index = (x + y * src.width) * 4;
       // Calculate HSV values
      let yValue = src.pixels[index];
      let cbValue = src.pixels[index + 1];
      let crValue = src.pixels[index + 2];

      // Define the ranges for hue, saturation, and value
      let isSegmented = (yValue >= 50 && yValue <= 200) &&
                        (cbValue >= 0 && cbValue <= 255) &&
                        (crValue >= 0 && crValue <= 255);

      // Checks if the current pixel's YcbCr values fall within the specified ranges
      let segmentedPixelValue = isSegmented ? 255 : 0;
      // Set segmented pixel values (grayscale)
      segmentedImage.pixels[index] = segmentedPixelValue;
      segmentedImage.pixels[index + 1] = segmentedPixelValue;
      segmentedImage.pixels[index + 2] = segmentedPixelValue;
      segmentedImage.pixels[index + 3] = src.pixels[index + 3]; // Alpha value
    }
  }

  segmentedImage.updatePixels();
  return segmentedImage;
}
// Callback function when face detection model is ready
function modelReady() {
  console.log("Face detection model ready!");
}

// Callback function when face detection results are obtained
function gotResults(err, result) {
  // Error handling
  if (err) {
    console.log(err);
    return;
  }
  // Store Face Detections
  detections = result;
  // If detected draw bounding box
  if (detections) {
    drawBox(detections, 0, 560, 160, 120);
    alert("face detected!"); 
  }
}

// Function to draw a rectangle around detected face
function drawBox(detections, offsetX, offsetY) {
  // Ensures that valid face detection data exists
  if (detections) {
    // Get aligned rectangle data
    const alignedRect = detections.alignedRect;
    // Extract box properties
    const { _x, _y, _width, _height } = alignedRect._box;

    // Drawing Setup
    noFill();
    stroke(161, 95, 251);
    strokeWeight(2);
    rect(_x + offsetX, _y + offsetY, _width, _height);
  }
}

// Function to apply the selected effect to the detected face
function applyEffectToFace(effect, detections, offsetX, offsetY) {
  if (hasapplyEffectToFace) {
    console.log("Effect has already been applied");
    return;
  }
  // Ensures valid face detection data exists
  if (detections) {
    const alignedRect = detections.alignedRect;
    // Get face bounding box
    const { _x, _y, _width, _height } = alignedRect._box;

    let faceImage;
    // A switch statement effect to apply based on the input effect parameter
    switch (effect) {
      // Apply greyscale
      case 'greyscale':
        faceImage = createGreyscaleImage(scaledPicture.get(_x, _y, _width, _height));
        break;
      case 'blurred':
        // Apply blurring
        let blurredImage = scaledPicture.get(_x, _y, _width, _height);
        blurredImage.filter(BLUR, 15);
        faceImage = blurredImage;
        break;
      case 'colorConverted':
        // Apply color converted 
        if (currentFaceModification === 'colorConverted') {
          faceImage = hsvImage.get(_x, _y, _width, _height);
        }
        break;
      case 'pixelate':
        // Apply pixelate
        faceImage = applyPixelationToFace(faceImage);
        faceImage = faceImage.get(_x, _y, _width, _height);
        break;
      default:
        faceImage = scaledPicture.get(_x, _y, _width, _height);
    }

    // Display the modified face
    image(faceImage, _x + offsetX, _y + offsetY, _width, _height);
  }
}

// Function to apply pixelation effect to a face
function applyPixelationToFace(faceImage, offsetX, offsetY) {
  faceImage = createGreyscaleImage(scaledPicture);
  const pixelatedImage = createImage(faceImage.width, faceImage.height);
  pixelatedImage.loadPixels();
  // Size of each pixelation block
  const blockSize = 5;
 
  // Iterates over the image in steps of blockSize
  for (let y = 0; y < faceImage.height; y += blockSize) {
    // The nested inner loops go through each pixel within a blockSize
    for (let x = 0; x < faceImage.width; x += blockSize) {
      // Average color calculation for a block
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

      // Nested loops iterates over the same block again to sets all pixels within the block to the calculated average color, 
      // creating the pixelated effect
      for (let blockY = 0; blockY < blockSize; blockY++) {
        for (let blockX = 0; blockX < blockSize; blockX++) {
          const currentX = x + blockX;
          const currentY = y + blockY;

          if (currentX < pixelatedImage.width && currentY < pixelatedImage.height) {
            const pixelIndex = (currentX + currentY * pixelatedImage.width) * 4;
            pixelatedImage.pixels[pixelIndex] = averageRed;
            pixelatedImage.pixels[pixelIndex + 1] = averageGreen;
            pixelatedImage.pixels[pixelIndex + 2] = averageBlue;
            pixelatedImage.pixels[pixelIndex + 3] = 255;
          }
        }
      }
    }
  }

  pixelatedImage.updatePixels();
  return pixelatedImage;
}