import Times from './Times.js';
import {rad,ccoord} from './TrigHelper.js';


function Timer ({ctx,timerSize,
                 timeColor='#33cc33',
                 clockColor='#232323',
                 bgColor='#fff',
                 textColor='#222',
                 font='Futura',
                 outerCircle=0.8,
                 tickCircle=0.7,
                 majorTick=0.5,
                }={}) {
    
    return {
        timerSize,
        ctx,
        draw (s) {
            let ctx = this.ctx;
            ctx.clearRect(0,0,this.timerSize,this.timerSize);
            this.top = -Math.PI/2;
            this.scale = Times.getScale(s);
            this.circleSize = this.scale.m
            this.unit = this.scale.u
            this.drawTimer();
            this.drawTimeCircle(s);
            this.drawLabel(s)
        },
        drawLabel (s) {
            let cx = this.timerSize/2
            let cy = this.timerSize/2
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = textColor
            this.ctx.font = `${this.timerSize/4}px ${font}`
            this.ctx.fillText(Times.getTimeLabel(s),cx,cy);
        },

        drawWedge (angle1, angle2, radius) {
            let cx = this.timerSize/2;
            let cy = this.timerSize/2;
            let ctx = this.ctx;
            ctx.beginPath();
            let [x,y] = ccoord(cx,cy)
                .getCoords(rad(angle1),radius*this.timerSize/2);
            let [x2,y2] = ccoord(cx,cy)
                .getCoords(rad(angle2),radius*this.timerSize/2);
            ctx.moveTo(cx,cy);
            ctx.lineTo(x,y);
            ctx.lineTo(x2,y2)
            ctx.lineTo(cx,cy);
        },

        drawButton (angle1, angle2, buttonBottom, buttonTop) {
            let ctx = this.ctx;            
            ctx.fillStyle = clockColor;
            ctx.beginPath();
            this.drawWedge(angle1,angle2,buttonTop); ctx.fill();
            ctx.fillStyle = 'white';
            // we're going to make third marks...
            let oneThird = angle1 + ((angle2 - angle1) / 3);
            let twoThird = angle2 - ((angle2 - angle1) / 3);
            ctx.beginPath();
            this.drawWedge(angle1,oneThird,buttonBottom); ctx.fill();
            this.drawWedge(twoThird,angle2,buttonBottom); ctx.fill();
        },

        drawTimer () {
            let cx = this.timerSize/2;
            let cy = this.timerSize/2;
            let ctx = this.ctx;
            ctx.strokeStyle = clockColor
            ctx.beginPath();
            ctx.lineWidth = 1;
            ctx.fillStyle = clockColor;
            // top thing
            this.drawButton(-80,-100,0.9,1);
            // Timer arm things
            this.drawButton(-55,-65,0.9,0.98); ctx.fill();
            this.drawButton(-180+55,-180+65,0.9,0.98); ctx.fill();
            ctx.beginPath();
            // Circle
            ctx.arc(cx,cy,outerCircle*(this.timerSize/2),0,Math.PI*2);
            ctx.fillStyle = bgColor
            ctx.fill()
            ctx.fillStyle = clockColor
            ctx.strokeStyle = clockColor
            ctx.stroke();
            ctx.beginPath();
            let even = true;
            for (let unitMark=0; unitMark < this.circleSize; unitMark += this.unit) {
                let percentage = unitMark / this.circleSize;
                let angle = Math.PI/2 + Math.PI*2*percentage
                let x1 = cx + Math.cos(angle) * (even&&majorTick||tickCircle)*this.timerSize/2;
                let x2 = cx + Math.cos(angle) * outerCircle*this.timerSize/2;
                let y1 = cy + Math.sin(angle) * (even&&majorTick||tickCircle)*this.timerSize/2;
                let y2 = cy + Math.sin(angle) * outerCircle*this.timerSize/2;
                ctx.beginPath();
                ctx.moveTo(x1,y1);
                ctx.lineTo(x2,y2);
                ctx.stroke();
                even = !even
            }
        },

        drawTimeCircle (s) {
            let cx = this.timerSize/2;
            let cy = this.timerSize/2;
            let ctx = this.ctx;
            let arcPercentage = s / this.circleSize;
            ctx.beginPath();
            ctx.lineWidth = 3
            ctx.strokeStyle = timeColor
            let end = this.top+(Math.PI*2*arcPercentage)
            ctx.arc(cx,cy,0.8*(this.timerSize/2),
                    this.top,end);
            ctx.stroke();
        }
    }
}

export default Timer;
