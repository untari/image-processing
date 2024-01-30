let video;
let picture;

function setup() {
  createCanvas(640 * 2, 480);
  video = createCapture(VIDEO);
  video.hide();

  // Create a button element
  const captureButton = createButton('Capture Picture');
  captureButton.id('captureButton');
  captureButton.mousePressed(takePicture);
}

function draw() {
  background(255);

  // Display the webcam image in the grid at the position titled "Webcam image"
  image(video, 0, 0, 320, 240);

  if (picture) {
    // Scale the picture to 160 x 120 pixels
    const scaledPicture = picture.get();
    scaledPicture.resize(160, 120);

    // Nested loop to convert the picture to grayscale and increase brightness
    scaledPicture.loadPixels();
    for (let i = 0; i < scaledPicture.pixels.length; i += 4) {
      let r = scaledPicture.pixels[i];
      let g = scaledPicture.pixels[i + 1];
      let b = scaledPicture.pixels[i + 2];

      // Convert to grayscale
      let gray = 0.299 * r + 0.587 * g + 0.114 * b;

      // Increase brightness by 20%
      let increasedBrightness = min(255, gray * 1.2);

      // Assign the new values
      scaledPicture.pixels[i] = increasedBrightness;
      scaledPicture.pixels[i + 1] = increasedBrightness;
      scaledPicture.pixels[i + 2] = increasedBrightness;
    }
    scaledPicture.updatePixels();

    // Display the modified image at the appropriate position
    image(scaledPicture, 360, 0);
  }
}

function takePicture() {
  // Take a picture when the button is clicked
  picture = video.get();
}

function savePicture() {
  // Save picture to disk
  save(picture, 'picture.png');
}