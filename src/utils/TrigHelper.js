 
 function getAngle (rx, ry) {
     // x and y relative to center...
     if (rx > 0) {
         const theta = Math.atan(ry/rx)
         if (theta < 0) {
             return Math.PI*2 + theta
         }
         else {
             return theta
         }
     }
     else if (rx < 0) {
         if (ry > 0 ) {
             return Math.PI + Math.atan(ry/rx)
         }
         else {
             return Math.PI + Math.atan(ry/rx)
         }
     }
     else if (rx == 0) {
         if (ry > 0) {
             return Math.PI/2
         }
         else {
             return Math.PI*2-(Math.PI/2)
         }
     }
 }

function ccoord (cx, cy) {
    return {
        getCoords (theta, length) {
            return [cx+Math.cos(theta)*length,
                    cy+Math.sin(theta)*length]
        }
    }
}

function deg (rad) {
    return rad * 180 / Math.PI
}

function rad (deg) {
    return Math.PI * 2 * (deg / 360);
}

export {getAngle,deg,rad,ccoord}
