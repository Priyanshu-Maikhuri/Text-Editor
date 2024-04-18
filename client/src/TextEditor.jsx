import React, { useCallback, useEffect, useState } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { io } from 'socket.io-client'
import { useParams } from 'react-router-dom'

const toolbarOptions = [
  [{ header: [1, 2, 3, 4, 5, 6, false] }],               // custom button values
  [{ font: [] }],
  [{ 'list': 'ordered' }, { 'list': 'bullet' }],
  ['bold', 'italic', 'underline'],        // toggled buttons
  [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
  [{ script: 'sub' }, { script: 'super' }],
  [{ 'align': [] }],
  ['image', 'blockquote', 'code-block'],
  ['clean']                                         // remove formatting button
];

const SAVE_INTERVAL_TIME = 2000

function TextEditor() {
  const {id: documentId} = useParams()
  const [socket, setSocket] = useState()
  const [quill, setQuill] = useState()

  useEffect(() => {
    const s = io("http://localhost:5174")
    setSocket(s)

    return () => {
      s.disconnect()
    }
  }, [])

  //for autosave
  useEffect(() => {
    if(socket == null || quill == null) return

    const interval = setInterval(() =>{
      socket.emit('save-document', quill.getContents())
    }, SAVE_INTERVAL_TIME)

    return () => {
      clearInterval(interval)
    }
  })
  useEffect(() => {
    if(socket == null || quill == null) return
    socket.once('load-document', document => {
      quill.setContents(document)
      quill.enable()
    })

    socket.emit('get-document', documentId)
  }, [socket, quill, documentId])

  useEffect(() => {
    if (quill == null || socket == null) return

    const handler = (delta) => {
      quill.updateContents(delta)
    }
    socket.on('receive-changes', handler)

    return () => {
      socket.off('receive-changes', handler)
    }
  }, [socket, quill])

  useEffect(() => {
    if (quill == null || socket == null) return
    
    const handler = (delta, oldDelta, source) => {
      if (source !== 'user') return
      socket.emit('send-changes', delta)
    }
    quill.on('text-change', handler)

    return () => {
      quill.off('text-change', handler)
    }
  }, [socket, quill])

  const wrapperref = useCallback((wrapper) => {
    if (wrapper == null) return
    wrapper.innerHTML = ''
    const editor = document.createElement('div')
    wrapper.append(editor)
    const q = new Quill(editor, {
      modules: {
        toolbar: toolbarOptions
      },
      theme: 'snow'
    })
    q.disable()
    q.setText('Loading...')
    setQuill(q)
  }, [])
  return (
    <div className='container' ref={wrapperref}></div>
  )
}

export default TextEditor