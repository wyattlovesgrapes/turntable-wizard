import { useState, useEffect, useRef } from 'react'
import './app.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import GIF from 'gif.js'


function App() {

  // global variables
  const [file, setFile] = useState(null)
  const [intensity, setIntensity] = useState(5) // light intensity
  const [camY, setCamY] = useState(1) // camera Y position
  const [camZ, setCamZ] = useState(3) // camera Z position
  const [fov, setFov] = useState(30) // field of view in degrees
  const [bgColor, setBgColor] = useState("#ffffff") // background color


  const canvasRef = useRef()

  // file upload event
  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0]
    if (uploadedFile) {
      const url = URL.createObjectURL(uploadedFile)
      setFile(url)
    }
  }

  
  useEffect(() => {
    if (file) {

      // setup three.js scene
      const canvas = canvasRef.current
      const scene = new THREE.Scene()
      scene.background = new THREE.Color(bgColor)
      const camera = new THREE.PerspectiveCamera(fov, canvas.clientWidth / canvas.clientHeight, 0.1, 1000)
      const renderer = new THREE.WebGLRenderer({ canvas })
      renderer.setSize(540, 360)

      // setup lights
      const overhead = new THREE.DirectionalLight(0xffffff, 3)
      overhead.position.set(0, 5, 0).normalize()
      scene.add(overhead)

      const frontRight = new THREE.DirectionalLight(0xffffff, intensity)
      frontRight.position.set(20, 0, 20).normalize()
      scene.add(frontRight)

      const frontLeft = new THREE.DirectionalLight(0xffffff, intensity)
      frontLeft.position.set(-20, 0, 20).normalize()
      scene.add(frontLeft)

      // uncomment to activate light helpers
      //const helperRight = new THREE.DirectionalLightHelper( frontRight, 5 )
      //scene.add( helperRight )
      //const helperLeft = new THREE.DirectionalLightHelper( frontLeft, 5 )
      //scene.add( helperLeft )

      // load the 3D model
      const loader = new GLTFLoader()
      loader.load(file, (gltf) => {
        const model = gltf.scene
        scene.add(model)

        // center the model in the scene
        const box = new THREE.Box3().setFromObject(model)
        box.getCenter(model.position).multiplyScalar(-1)

        // capture images
        let capturedImages = []

        function captureImage() {
          renderer.render(scene, camera)
          const imageUrl = renderer.domElement.toDataURL('image/jpeg')      
          capturedImages.push(imageUrl)
          if (capturedImages.length === 180) {
            console.log(capturedImages)
            createGif()
          }
        }

        // create a gif
        function createGif() {
          const gif = new GIF({
            workers: 2,
            quality: 10,
            width: 540,
            height: 360,
            delay: 16,
            workerScript: '/node_modules/gif.js/dist/gif.worker.js',
          })
        
          // loop through the captured images and add each one to the GIF
          capturedImages.forEach((image, index) => {
            const img = new Image()
            img.src = image 

            img.onload = () => {
              gif.addFrame(img, { delay: 100, copy: true }) 
              if (index === capturedImages.length - 1) {
                gif.on('finished', (blob) => {
                  // Create a URL for the generated GIF
                  const gifUrl = URL.createObjectURL(blob)
                  // Create a link to download the GIF
                  const downloadLink = document.createElement('a')
                  downloadLink.href = gifUrl
                  downloadLink.download = 'animation.gif'
                  downloadLink.click()
                })
                
                gif.render()
              }
            }
          })
        }

        // render loop
        let capturing = true
        let frameCount = 1
    
        const animate = () => {
          requestAnimationFrame(animate)
          
          // capturing
          if (capturing === true) {
            frameCount++
            if(frameCount > 5 && frameCount < 186) {
                captureImage()
                console.log(frameCount)
              }
            if (frameCount > 186) {
              capturing = false
            }
          }

          // update settings

          // update camera position
          camera.position.y = camY
          camera.position.z = camZ
          // update FOV
          camera.fov = fov 
          camera.updateProjectionMatrix() 
          // ensure the camera looks at (0, 0, 0)
          camera.lookAt(0, 0, 0)
          // rotate model
          model.rotation.y += 2 * (Math.PI / 180)
          // render scene updates
          renderer.render(scene, camera)
        }
        animate()
      })

      return () => {
        renderer.dispose()
        scene.clear()
      }
    }
  }, [file, camY, camZ, fov, bgColor, intensity]) 


  return (
    <div id="root">
      <div className="navBar">
        <span>turntable-wizard</span>
        <span>Version: 0.0.1</span>
      </div>
      <div className="canvas-container">
        <canvas ref={canvasRef} style={{ width: '600px', height: '400px' }} />
        {!file && <div className="placeholder-text">Load Model Here</div>}
      </div>
      <div className="controls">
        <div className="controls-row">
          <input type="file" accept=".glb,.obj" onChange={handleFileUpload} />
          <label className="inputField">
            Intensity:
            <input
              id="intensity"
              type="number"
              value={intensity}
              onChange={(e) => setIntensity(e.target.value)}
            />
          </label>
          <label className="inputField">
            BG Color:
            <input
              id="bgColor"
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
            />
          </label>
        </div>
        <div className="controls-row">
          <label className="inputField">
            Cam Y:
            <input
              id="camY"
              type="number"
              value={camY}
              onChange={(e) => setCamY(parseFloat(e.target.value))}
              step="0.1"
            />
          </label>
          <label className="inputField">
            Cam Z:
            <input
              id="camZ"
              type="number"
              value={camZ}
              onChange={(e) => setCamZ(parseFloat(e.target.value))}
              step="0.1"
            />
          </label>
          <label className="inputField">
            FOV:
            <input
              id="fov"
              type="number"
              value={fov}
              onChange={(e) => setFov(parseFloat(e.target.value))}
              min="10"
              max="120"
              step="5"
            />
          </label>
        </div>
      </div>
    </div>
  )
}

export default App
