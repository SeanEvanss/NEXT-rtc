import Head from 'next/head'
import Image from 'next/image'

import Webcam from './comppnents/webcam'

export default function Home() {
  return (

    <div>
      <title>
        Connect. Instantly.
      </title>      
      <Webcam/>
    </div>


  )
}
