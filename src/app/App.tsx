
import React, {useLayoutEffect, useState} from 'react';

// import rough from 'roughjs/bundled/rough.esm';
import rough from "roughjs/bin/rough.js";

import './App.css';


const generator = rough.generator();

// ---------------------------------------------------------------------------

type Position = string | null | undefined

interface Point {
    x: number,
    y: number
}

interface PairOfPoints {
    topLeft: Point,
    bottomRight: Point
}

interface DrawingElement {
    id: number,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    type: string,
    roughElement: any,
    position?: Position
}


// ---------------------------------------------------------------------------

const App = () => {

    const [elements, setElements] = useState<DrawingElement[]|[]>([]);
    const [action, setAction] = useState('none');
    const [tool, setTool] = useState('line');
    const [selectedElement, setSelectedElement] = useState<DrawingElement|null>(null);
    const [mouseDownPoint, setMouseDownPoint] = useState<Point|null>(null)
    const [mousePoint, setMousePoint] = useState<Point|null>(null)

    // -----------------------------------------------------------------------

    const createElement = (id: number, x1: number, y1: number, x2: number, y2: number, type: string) => {
        let roughElement

        switch (type) {
            case 'line': {
                roughElement = generator.line(x1, y1, x2, y2)
                break
            }
            case 'rectangle': {
                roughElement = generator.rectangle(x1, y1, x2 - x1, y2 - y1)
                break
            }
            case 'circle': {
                roughElement = generator.circle(x1 + (x2 - x1)/2, y1 + (y2 - y1)/2, 
                                Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)))
                break
            }
            case 'ellipse': {
                roughElement = generator.ellipse(x1 + (x2 - x1)/2, y1 + (y2 - y1)/2, 
                                x2 - x1, y2 - y1)
                break
            }
            default:
                roughElement = null
        }

        return {id, x1, y1, x2, y2, type, roughElement}
    }

    // -----------------------------------------------------------------------

    useLayoutEffect(() => {
        const canvas  = document.getElementById('canvas');
        if (canvas != null && (canvas instanceof HTMLCanvasElement)) {
            const context = canvas.getContext('2d');

            if (context !== null) {
                context.clearRect(0, 0, canvas.width, canvas.height)
                // context.fillStyle = 'green';
                // context.fillRect(10, 10, 100, 100);
                // context.strokeRect(200, 200, 100,100);
            }
            
            const roughCanvas = rough.canvas(canvas);

            // const rect = generator.rectangle(50, 50, 100, 100);
            // const line = generator.line(50, 50, 150, 150);

            // roughCanvas.draw(rect);
            // roughCanvas.draw(line);

            elements.forEach(({roughElement}) => roughCanvas.draw(roughElement))
        }
    }, [elements])

    // -----------------------------------------------------------------------

    const distance = (a: Point, b: Point): number => 
        Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))

    // -----------------------------------------------------------------------

    const isWithinElement = (
            x: number,
            y: number,
            element: DrawingElement) => {

        const {type, x1, x2, y1, y2} = element

        switch (type) {
            case 'rectangle': {
                const minX = Math.min(element.x1, element.x2)
                const maxX = Math.max(element.x1, element.x2)
                const minY = Math.min(element.y1, element.y2)
                const maxY = Math.max(element.y1, element.y2)
                return x >= minX && x <= maxX && y >= minY && y <= maxY
            }
            case 'circle': {
                const minX = Math.min(element.x1, element.x2)
                const maxX = Math.max(element.x1, element.x2)
                const minY = Math.min(element.y1, element.y2)
                const maxY = Math.max(element.y1, element.y2)
                return x >= minX && x <= maxX && y >= minY && y <= maxY
            }
            case 'ellipse': {
                const minX = Math.min(element.x1, element.x2)
                const maxX = Math.max(element.x1, element.x2)
                const minY = Math.min(element.y1, element.y2)
                const maxY = Math.max(element.y1, element.y2)
                return x >= minX && x <= maxX && y >= minY && y <= maxY
            }
            default: {
                const a: Point = {x: x1, y: y1}
                const b: Point = {x: x2, y: y2}
                const c: Point = {x, y}
                const offset: number = distance(a, b) - (distance(a, c) + distance(b, c))
                return Math.abs(offset) < 1
            }          
        }
    }
    

    // -----------------------------------------------------------------------

    const nearPoint = (
        x: number,
        y: number,
        x1: number,
        y1: number,
        name: string) => {
        return (Math.abs(x - x1) < 5 && Math.abs(y - y1) < 5) ? name : null
    }

    // -----------------------------------------------------------------------

    const positionWithinElement = (
            x: number,
            y: number,
            element: DrawingElement): string|null => {

        const {type, x1, y1, x2, y2} = element

        switch (type) {
            case 'rectangle': {
                const topLeft = nearPoint(x, y, x1, y1, 'tl')
                const topRight = nearPoint(x, y, x2, y1, 'tr')
                const bottomLeft = nearPoint(x, y, x1, y2, 'bl')
                const bottomRight = nearPoint(x, y, x2, y2, 'br')
                // return {x1: minX, y1: minY, x2: maxX, y2: maxY}
                const inside =  x >= x1 && x <= x2 && y >= y1 && y <= y2 ? "inside" : null
                return topLeft || topRight || bottomLeft || bottomRight || inside
            }
            case 'line': {
                const a: Point = {x: x1, y: y1}
                const b: Point = {x: x2, y: y2}
                const c: Point = {x, y}
                const offset: number = distance(a, b) - (distance(a, c) + distance(b, c))
                const start = nearPoint(x, y, x1, y1, 'start')
                const end = nearPoint(x, y, x2, y2, 'end')
                const inside =  Math.abs(offset) < 1 ? 'inside' : null
                return start || end || inside

            }
            default:
                return null
        }

    }

    // -----------------------------------------------------------------------

    const getElementAtPosition = (
            x: number,
            y: number,
            elements: DrawingElement[]) => {

        return elements
                .map(element => ({...element, position: positionWithinElement(x, y, element)}))
                .find(element => element.position !== null)
    }

    // -----------------------------------------------------------------------

    const adjustElementCoordinates = (element: DrawingElement) => {
        const {type, x1, y1, x2, y2} = element

        switch (type) {
            case 'rectangle':
            case 'circle' :
            case 'ellipse':
                {
                const minX = Math.min(x1, x2)
                const maxX = Math.max(x1, x2)
                const minY = Math.min(y1, y2)
                const maxY = Math.max(y1, y2)
                return {x1: minX, y1: minY, x2: maxX, y2: maxY}
            }
            case 'line': {
                if (x1 < x2 || x1=== x2 && y1 < y2) {
                    return {x1,y1, x2, y2}
                } else {
                    return {x2, y2, x1, y1}
                }
            }
            default: {
                return {x1: 10, y1: 10, x2: 20, y2: 20}
            }
        }
    }


    // -----------------------------------------------------------------------

    const updateElement = (
            id: number,
            x1: number,
            y1: number,
            x2: number,
            y2: number,
            type: string) => {

        const updatedElement = createElement(id, x1, y1, x2, y2, type)
        
        const elementsCopy: DrawingElement[] = [...elements]

        elementsCopy[id] = updatedElement

        setElements(elementsCopy)
    }

    // -----------------------------------------------------------------------

    const cursorForPosition = (position: Position) => {
        switch (position) {
            case 'tl':
            case 'br':
            case 'start':
            case 'end':
                return 'nwse-resize'
            case 'tr':
            case 'bl':
                return 'nesw-resize'
            default:
                return "move"
        }
    }

    // -----------------------------------------------------------------------

    const resizeCoordinates = (
            clientX: number,
            clientY: number,
            x1: number,
            y1: number,
            x2: number,
            y2: number,
            position: Position): PairOfPoints|null => {

        let tl: Point
        let br: Point

        switch (position) {
            case 'tl':
            case 'start':
                tl = {x: clientX, y: clientY}
                br = {x: x2, y: y2}
                return {topLeft: tl, bottomRight: br}
            case 'tr':
                tl = {x: x1, y: clientY}
                br = {x: clientX, y: y2}
                return {topLeft: tl, bottomRight: br}
            case 'bl':
                tl = {x: clientX, y: y1}
                br = {x: x2, y: clientY}
                return {topLeft: tl, bottomRight: br}
            case 'br':
            case 'end':
                tl = {x: x1, y: y1}
                br = {x: clientX, y: clientY}
                return {topLeft: tl, bottomRight: br}
            default:
                return null
        }
    }

    // -----------------------------------------------------------------------

    const mouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {

        const {clientX, clientY} = event;
        const point: Point = {x: clientX, y: clientY}

        setMouseDownPoint(point)

        console.log(`Down ${point.x} ${point.y} - Tool ${tool}`)

        if (tool === 'selection') {
            // If we are on an element
            const element = getElementAtPosition(point.x, point.y, elements)

            if (element) {
                setSelectedElement(element)
                console.log(JSON.stringify(element))
                if (element.position === 'inside') {
                    setAction('moving')
                } else {
                    setAction('resizing')
                }
            }
        } else {
            const id = elements.length

            const element = createElement(id, point.x, point.y, point.x, point.y, tool);
            
            setElements(prevState => [...prevState, element]);

            setAction('drawing');
        }
    }

    // -----------------------------------------------------------------------

    const mouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {

        const {clientX, clientY} = event

        const point: Point = {x: clientX, y: clientY}

        setMousePoint(point)

        if (tool === 'selection') {
            const element = getElementAtPosition(clientX, clientY, elements)
            console.log(JSON.stringify(element))
            if (element) {
                const cursor = cursorForPosition(element.position)
                console.log(cursor)
                event.currentTarget.style.cursor = cursor
            } else {
                event.currentTarget.style.cursor = "default"  
            }
        }

        if (!action || (action == '')) {
            return;
        }

        switch (action) {

            case 'drawing': {

                const index = elements.length - 1

                const {x1, y1} = elements[index]

                updateElement(index, x1, y1, clientX, clientY, tool)

                break
            }

            case 'moving': {

                // event.currentTarget.style.cursor = "move"

                if (selectedElement !== null) {
                    const {id, x1, y1, x2, y2, type} = selectedElement

                    // const width = x2 - x1
                    // const height = y2 - y1
    
                    if (mouseDownPoint) {
                        const deltaX = clientX - mouseDownPoint.x
                        const deltaY = clientY - mouseDownPoint.y

                        updateElement(id, x1 + deltaX, y1 + deltaY, x2 + deltaX, y2 + deltaY, type)
                    }
                }
                break
            }

            case 'resizing': {
                if (selectedElement !== null) {
                    const {id, type, position, x1, y1, x2, y2 } = selectedElement
                    const points = resizeCoordinates(clientX, clientY, x1, y1, x2, y2, position)
                    if (points) {
                        const {topLeft, bottomRight} = points
                        updateElement(id, topLeft.x, topLeft.y, bottomRight.x, bottomRight.y, type)
                    }

                }
                break
            }

            default:
                break
        }
    }

    // -----------------------------------------------------------------------

    const mouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const index = selectedElement?.id
        if (index !== undefined) {
            const {id, type} = elements[index]
            if (action === 'drawing' || action === 'moving' || action === 'resizing') {
                const {x1, y1, x2, y2} = adjustElementCoordinates(elements[index])
                updateElement(id, x1, y1, x2, y2, type)
            }
        }
        setAction('none')
        setSelectedElement(null)
        event.currentTarget.style.cursor = "default"
    }

    // -----------------------------------------------------------------------

    return (
        <div className="App">
            <div style={{position: 'fixed'}}>
                <input type='radio'
                    id='line'
                    checked={tool === 'selection'}
                    onChange={() => setTool('selection')}
                />
                <label htmlFor='selection'>Selection</label>
                <input type='radio'
                    id='line'
                    checked={tool === 'line'}
                    onChange={() => setTool('line')}
                />
                <label htmlFor='line'>Line</label>
                <input type='radio'
                    id='rectangle'
                    checked={tool === 'rectangle'}
                    onChange={() => setTool('rectangle')}
                />
                <label htmlFor='rectangle'>Rectangle</label>
                <input type='radio'
                    id='circle'
                    checked={tool === 'circle'}
                    onChange={() => setTool('circle')}
                />
                <label htmlFor='circle'>Circle</label>
                <input type='radio'
                    id='ellipse'
                    checked={tool === 'ellipse'}
                    onChange={() => setTool('ellipse')}
                />
                <label htmlFor='ellipse'>Ellipse</label>
                <span style={{padding: '25px'}}>&nbsp;
                    <input type='text'
                        id='point'
                        readOnly
                        value={mouseDownPoint ? `{x: ${mouseDownPoint.x}, y: ${mouseDownPoint.y}}` : 'None'}
                    />
                    <label htmlFor='point' style={{paddingLeft: '5px'}}>Mouse Down</label>
                    <input type='text'
                        id='point'
                        readOnly
                        value={mousePoint ? `{x: ${mousePoint.x}, y: ${mousePoint.y}}` : 'None'}
                    />
                    <label htmlFor='point' style={{paddingLeft: '5px'}}>Mouse Point</label>
                </span>
            </div>
            <canvas 
                id='canvas'
                style={{backgroundColor: '#e0e0e0'}}
                width={window.innerWidth}
                height={window.innerHeight}
                onMouseDown={mouseDown}
                onMouseMove={mouseMove}
                onMouseUp={mouseUp}
            >
                Canvas
            </canvas>
        </div>
    );
}

// ---------------------------------------------------------------------------

export default App;


// ---------------------------------------------------------------------------
// Notes
//
//  * https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
//  * https://www.youtube.com/watch?v=6arkndScw7A Building a Drawing App in React - Pt 1
//  * https://www.youtube.com/watch?v=IcfhcJrtJqI Building a Drawing App in React - Pt 2: Moving Elements
//
// and
//
//  * https://github.com/rough-stuff/rough/issues/145
//  * 