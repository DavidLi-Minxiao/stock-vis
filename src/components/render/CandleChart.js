import React from 'react'
import { connect } from 'react-redux'
import ReactFauxDOM from 'react-faux-dom'
import {event as currentEvent} from 'd3-selection'

const d3 = Object.assign({}, require('d3-scale'), require('d3-selection'), require('d3-selection-multi'), require('d3-axis'), require('d3-path'), require('d3-shape'), require('d3-array'))

class CandleChart extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      chart: '',
      w: NaN,
      h: NaN,
      opacity: 0,
      mouseActive: false,
      text: 'hello',
      x: 0
    }
  }

  componentDidMount () {
    let w = document.getElementsByClassName('svgContainer')[0].parentElement.offsetWidth
    let h = (w / 2)
    this.setState({w: w, h: h})
  }

  render () {
    let w = this.state.w || 1000
    let h = this.state.h || 500
    let m = {top: 40, right: 30, bottom: 20, left: 50}
    let p = 1.005

    let svgNode = ReactFauxDOM.createElement('div')
    let svg = d3.select(svgNode).append('svg').attr('width', w).attr('height', h)

    let data = this.props.data

    data.forEach((d) => {
      d[0] = new Date(d[0])
    })

    let bisectDate = d3.bisector((d) => { return d[0] }).left

    let band = w / (data.length + 1) / 7 * 5
    band = band > 5 ? band : 5

    let xScale = d3.scaleTime()
      .domain(d3.extent(data, (d) => { return d[0] }))
      .rangeRound([m.left + (band / 2), w - m.right - (band / 2)])

    let yScale = d3.scaleLinear()
      .domain([d3.min(data, (d) => { return d[3] }) / p, d3.max(data, (d) => { return d[2] }) * p])
      .range([h - m.top, m.bottom])

    let xAxis = d3.axisBottom(xScale).tickSize(3).ticks(6).tickSizeOuter(0)
    let yAxisL = d3.axisLeft(yScale).tickSize(3).ticks(10)
    let yAxisR = d3.axisRight(yScale).tickSize(3).ticks(10)

    svg.append('g')
      .call(xAxis)
      .attr('transform', 'translate(0,' + (h - m.bottom - (m.top / 2)) + ')')
      .select('.domain')
      .attr('stroke', '#606c76')

    svg.append('g')
      .call(yAxisL)
      .attr('transform', `translate(${m.left},${0})`)
      .select('.domain')
      .remove()

    svg.append('g')
      .call(yAxisR)
      .attr('transform', `translate(${w - m.right},${0})`)
      .select('.domain')
      .remove()

    svg.append('text')
        .attrs({
          transform: 'rotate(-90)',
          y: '1.6rem',
          x: -30,
          'text-anchor': 'end'
        })
        .text('Price (USD)')

    let draw2 = svg.append('svg').attr('width', w - m.left - m.right).attr('height', h - m.top - m.bottom)
      .attr('transform', `translate(${m.left},${m.top})`)
    let draw = svg.append('svg').attr('width', w - m.left - m.right).attr('height', h - m.top - m.bottom)
      .attr('transform', `translate(${m.left},${m.top})`)

    draw2.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attrs({
          height: (d) => { return (yScale(d[3]) - yScale(d[2])) },
          width: 1,
          x: (d) => {
            return (xScale(d[0]))
          },
          y: (d) => { return yScale(d[2]) },
          fill: '#606c76'
        })

    draw.selectAll('rect')
        .data(data)
        .enter()
        .append('rect')
        .attrs({
          height: (d) => {
            if (d[4] > d[1]) {
              return (yScale(d[1]) - yScale(d[4]))
            } else {
              return (yScale(d[4]) - yScale(d[1]))
            }
          },
          width: band,
          x: (d) => {
            return (xScale(d[0]) - (band / 2))
          },
          y: (d) => {
            if (d[4] > d[1]) {
              return (yScale(d[4]))
            } else {
              return (yScale(d[1]))
            }
          },
          fill: (d) => {
            if (d[4] > d[1]) {
              return ('black')
            } else {
              return ('#F44336')
            }
          }
        })

    let focus = svg.append('g')
      .attrs({
        opacity: this.state.mouseActive ? 0.87 : 0
      })

    focus.append('rect')
        .attrs({
          width: 1,
          height: h - m.top - m.bottom,
          transform: `translate(${this.state.x},${m.top / 2})`,
          fill: '#606c76'
        })

    focus.append('text')
      .attrs({
        transform: `translate(${this.state.x},15)`,
        class: 'tooltip',
        'text-anchor': 'middle',
        'font-size': 12
      })
      .text(this.state.text)

    svg.append('rect')
      .attrs({
        width: w - m.right - m.left,
        height: h,
        transform: `translate(${m.left},0)`,
        opacity: 0
      })
      .on('mouseover', () => {
        this.setState({
          mouseActive: true
        })

        data.sort((a, b) => { return a[0] - b[0] })
      })
      .on('mouseout', () => {
        this.setState({
          mouseActive: false
        })
      })
      .on('mousemove', () => {
        let x0 = xScale.invert(currentEvent.offsetX)
        let i = bisectDate(data, x0, 1)
        let d0 = data[i - 1]
        let d1 = data[i]
        let d = x0 - d0.date > d1.date - x0 ? d1 : d0
        this.setState({
          x: currentEvent.offsetX,
          text: `${d[0].getFullYear()}-${d[0].getMonth() + 1}-${d[0].getDate() + 1} - ${d[1]}`
        })
      })

    return (
      <div className='svgContainer'>
        {svgNode.toReact()}
      </div>
    )
  }
}

const mapStateToProps = (state) => {
  return {
    data: state.data
  }
}

CandleChart.propTypes = {
  data: React.PropTypes.array.isRequired
}

export default connect(mapStateToProps)(CandleChart)
