(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['exports'], factory);
  } else if (typeof exports === 'object' && typeof module !== 'undefined') {
    factory(exports);
  } else {
    factory(root.Plot = root.Plot || {});
  }
}(this, function (exports) {
  const defaultConfigs = {
    base: {
      canvasSize: {
        w: 1200, // width
        h: 800 // height
      },
      margin: {
        h: 100, // horizontal
        v: 100 // vertical
      },
      zoom: false
    },
    candleStick: {
      blockWidth: 10
    },
    occurrence: {
      unitSize: { // unit block size
        width: 8,
        height: 8
      },
      gap: 0 // gap between blocks
    }
  }
  // fetch data
  function getData(url, type, callback) {
    switch (type) {
      case 'json':
        return d3.json(url, callback);
      case 'tsv':
        return d3.tsv(url, callback);
      default:
        return d3.csv(url, callback);
    }
  }
  // draw candleStick chart
  function candleStick(data, elem, configs) {
    const options = Object.assign({}, defaultConfigs.base, defaultConfigs.candleStick, configs);
    const canvasSize = options.canvasSize;
    const margin = options.margin;
    const blockWidth = options.blockWidth;
    let x = d3.scaleTime().range([0, canvasSize.w]);
    let y = d3.scaleLinear().range([canvasSize.h, 0]);
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y);
    const timeRange = getTimeRange(data);
    const valueRange = getMinAndMax(data);

    x.domain(timeRange.map(function (v, i) {
      const tmpDate = new Date(v);
      if (i === 0) {
        tmpDate.setDate(tmpDate.getDate() - 2);
      } else {
        tmpDate.setDate(tmpDate.getDate() + 2);
      }
      return tmpDate;
    }));
    y.domain(valueRange.map(function (v, i) {
      return i === 0 ? roundNumber(v, 10, false) : roundNumber(v, 10, true);
    }));

    const svg = d3.select(elem)
      .append('svg')
      .attr('width', canvasSize.w + 2 * margin.h)
      .attr('height', canvasSize.h + 2 * margin.v)
      .call(d3.zoom().on('zoom', zoomed));

    // clipPath
    // !important
    // 注意这里clippath的作用区域是与引用的元素相关的
    // pay attention that the clippath area is related to the ref element
    const clip = svg.append('defs')
      .append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('width', canvasSize.w)
      .attr('height', canvasSize.h);

    const container = svg.append('g')
      .attr('transform', 'translate(' + margin.h + ', ' + margin.v + ')');

    container.append('g')
      .attr('class', 'xAxis')
      .attr('transform', 'translate(0, ' + canvasSize.h + ')');

    container.append('g')
      .attr('class', 'yAxis');
    // .call(yAxis);

    const content = container.append('g')
      .attr('class', 'clipArea')
      .attr('clip-path', 'url(#clip)')
      .append('g')
      .attr('class', 'content');
    const blocks = content.selectAll('.block')
      .data(data)
      .enter()
      .append('path')
      .style('stroke-width', 1)
      .style('fill', '#d5e1dd')
      .style('stroke', '#000000');

    draw();

    function draw() {
      d3.select('.xAxis').call(xAxis);
      d3.select('.yAxis').call(yAxis);
      blocks.attr('d', function (d) {
        return getPath(d);

      })
    }

    function zoomed() {
      content.attr('transform', d3.event.transform);
      d3.select('.xAxis').call(xAxis.scale(d3.event.transform.rescaleX(x)));
      d3.select('.yAxis').call(yAxis.scale(d3.event.transform.rescaleY(y)));
      // transformClip();
    }

    function getMinAndMax(data) {
      const minArr = data.map(function (v) {
        return v.value[0];
      });
      const maxArr = data.map(function (v) {
        return v.value[v.value.length - 1];
      })
      return [d3.min(minArr), d3.max(maxArr)];
    }

    function getTimeRange(data) {
      const timeArr = data.map(function (v) {
        return new Date(v.date);
      });
      return [d3.min(timeArr), d3.max(timeArr)];
    }

    function getPath(d) {
      const xCoor = x(new Date(d.date));
      return (
        'M ' + xCoor + ' ' + y(d.value[0]) + ' ' +
        'V ' + y(d.value[1]) + ' ' +
        'H ' + (xCoor - blockWidth / 2) + ' ' +
        'V ' + y(d.value[2]) + ' ' +
        'H ' + (xCoor + blockWidth / 2) + ' ' +
        'V ' + y(d.value[1]) + ' ' +
        'H ' + xCoor + ' ' +
        'M ' + xCoor + ' ' + y(d.value[2]) + ' ' +
        'V ' + y(d.value[3])
      )
    }
  }

  function occurrence(data, elem, configs) {
    const options = Object.assign({}, defaultConfigs.base, defaultConfigs.occurrence, configs);
    const xAxisLabel = options.xAxis;
    const yAxisLabel = options.yAxis;
    const range = options.range;
    const color = options.color;
    const unitSize = options.unitSize;
    const gap = options.gap;
    const contentSize = {
      width: xAxisLabel.length * unitSize.width + (xAxisLabel.length - 1) * gap,
      height: yAxisLabel.length * unitSize.height + (yAxisLabel.length - 1) * gap
    };
    const margin = options.margin;
    const svg = d3.select(elem)
      .append('svg')
      .attr('class', 'wrapper')
      .attr('width', contentSize.width + 2 * margin.v)
      .attr('height', contentSize.height + 2 * margin.h)
      .call(d3.zoom().on('zoom', zoomed));
    // content svg
    const contentWrapper = svg.append('svg')
      .attr('class', 'content')
      .attr('width', contentSize.width)
      .attr('height', contentSize.height)
      .attr('x', margin.h)
      .attr('y', margin.v);
    // axis svg
    const xAxisSvg = svg.append('svg')
      .attr('class', 'xAxisSvg')
      .attr('x', margin.h)
      .attr('y', 0)
      .attr('width', contentSize.width)
      .attr('height', margin.v);

    const yAxisSvg = svg.append('svg')
      .attr('class', 'yAxisSvg')
      .attr('x', 0)
      .attr('y', margin.v)
      .attr('width', margin.h)
      .attr('height', contentSize.height);
    const content = contentWrapper.append('g');

    const blocks = [];
    for (let x = 0; x < yAxisLabel.length; x++) {
      for (let y = 0; y < xAxisLabel.length; y++) {
        blocks.push({
          x: x,

          y: y,
          names: yAxisLabel[x] + ', ' + xAxisLabel[y],
          // 对称分布
          count: blocks[y * yAxisLabel.length + x] ? blocks[y * yAxisLabel.length + x].count : Math.floor(Math.random() * (range[1] - range[0])) + range[0]
        })
      }
    }
    content.selectAll('.block')
      .data(blocks)

      .enter()
      .append('rect')
      .attr('class', 'block')
      .attr('x', function (d) {
        return d.y * (unitSize.width + gap);
      })
      .attr('y', function (d) {
        return d.x * (unitSize.height + gap);
      })
      .attr('width', unitSize.width)
      .attr('height', unitSize.height)
      .style('fill', function (d) {
        return getColor(d);
      })
      .on('mouseenter', function (d) {
        d3.select('#container')
          .append('div')
          .attr('class', 'tip')
          .style('top', d3.event.clientY - 20 + 'px')
          .style('left', d3.event.clientX + 20 + 'px')
          .html(generateTip(d.names, d.count))
      })
      .on('mouseleave', function (d) {
        d3.select('.tip').remove();
      });

    // add axis text
    const xAxis = xAxisSvg.append('g')
      .attr('class', 'x-axis-wrapper axis-wrapper')
      .attr('transform', 'translate(0, ' + margin.v + ') rotate(-90)');
    xAxis.selectAll('text')
      .data(xAxisLabel)
      .enter()
      .append('text')
      .attr('class', 'x-axis')
      .attr('x', 3)
      .style('font-size', unitSize.width + 'px')
      .style('text-anchor', 'start')
      .text(function (d) {
        return d;
      })
      .attr('y', function (d, i) {
        return i * (unitSize.width + gap) + (unitSize.width + this.getBBox().height / 2) / 2;
      });

    const yAxis = yAxisSvg.append('g')
      .attr('class', 'y-axis-wrapper axis-wrapper');

    yAxis.selectAll('text')
      .data(yAxisLabel)
      .enter()
      .append('text')
      .attr('class', 'y-axis')
      .attr('x', margin.h - 5)
      .style('text-anchor', 'end')
      .style('font-size', unitSize.height + 'px')
      .text(function (d) {
        return d;
      })
      .attr('y', function (d, i) {
        return i * (unitSize.height + gap) + (unitSize.height + this.getBBox().height / 2) / 2;
      });

    function generateTip(date, rate) {
      return '<ul>' +
        '<li><span class="title">names: </span>' + date + '</li>' +
        '<li><span class="title">count: </span>' + rate + '</li>' +
        '</ul>';
    }

    function zoomed() {
      content.attr('transform', 'translate(' + d3.event.transform.x + ', ' + d3.event.transform.y + ') ' + 'scale(' + d3.event.transform.k + ')');
      // xAxis.attr('transform', 'translate(' + (d3.event.transform.x + 12 * d3.event.transform.k) + ', ' + (space + height + 8 - xAxisWidth * 0.65 * d3.event.transform.k) + ') rotate(-90) ' + 'scale(' + d3.event.transform.k + ')');
      // yAxis.attr('transform', 'translate(' + (space + width + 8 - yAxisWidth * 0.65 * d3.event.transform.k) + ', ' + (d3.event.transform.y + 12 * d3.event.transform.k) + ') scale(' + d3.event.transform.k + ')');
      d3.selectAll('.x-axis')
        .attr('y', function (d, i) {
          return d3.event.transform.x + (i * (unitSize.width + gap) + (unitSize.width + this.getBBox().height / 2) / 2) * d3.event.transform.k - (d3.event.transform.k - 1) * 3;
        })

      d3.selectAll('.y-axis')
        .attr('y', function (d, i) {
          return d3.event.transform.y + (i * (unitSize.height + gap) + (unitSize.height + this.getBBox().height / 2) / 2) * d3.event.transform.k - (d3.event.transform.k - 1) * 3;
        })
    }

    function getColor(d) {
      if (d.count === 0) {
        return '#fbfbfb';
      } else if (d.x < 10 && d.y < 10) {
        if (d.count < (range[0] + range[1]) / 2) return color[0];
        return color[1];
      } else if (d.x >= 10 && d.x < 20 && d.y >= 10 && d.y < 20) {
        if (d.count < (range[0] + range[1]) / 2) return color[2];
        return color[3];
      } else if (d.x >= 20 && d.x < 30 && d.y >= 20 && d.y < 30) {
        if (d.count < (range[0] + range[1]) / 2) return color[4];
        return color[5];
      } else if (d.x >= 30 && d.x < 40 && d.y >= 30 && d.y < 40) {
        if (d.count < (range[0] + range[1]) / 2) return color[6];
        return color[7];
      } else if (d.x >= 40 && d.x < 50 && d.y >= 40 && d.y < 50) {
        if (d.count < (range[0] + range[1]) / 2) return color[8];
        return color[9];
      } else {
        return Math.random() < 0.05 ? '#e5e5e5' : '#fbfbfb';
      }
    }
  }

  function iris(data, elem, configs) {
    const options = Object.assign({}, defaultConfigs.base, configs);
    const canvasSize = options.canvasSize;
    const margin = options.margin;
    const contentSize = {
      width: 600,
      height: 600
    };
    const range = options.range;

    draw('svg', d3.resolution());

    function draw(type, r) {
      d3.selectAll('.container ' + type).remove();
      const container = d3.select('.container')
        .append(type)
        .classed('container', true)
        .attr('width', canvasSize.w)
        .attr('height', canvasSize.h)
        .canvasResolution(r)
        .canvas(true)
        .call(d3.zoom().on('zoom', zoom));

      const x = d3.scaleLinear()
        .domain(range.x)
        .range([0, contentSize.width]);

      const y = d3.scaleLinear()
        .domain(range.y)
        .range([contentSize.height, 0]);

      const clip = container.append('defs')
        .append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr('width', contentSize.width)
        .attr('height', contentSize.height);

      const content = container.append('g')
        .classed('content', true)
        .attr('transform', 'translate(' + margin.h + ', ' + margin.v + ')')
        .attr('clip-path', 'url(#clip)')
        .attr('width', contentSize.width)
        .attr('height', contentSize.height)
        .selectAll('circle')
        .data(data)
        .enter()
        .append('circle')
        .attr('cx', function (d) {
          return x(d.x);
        })
        .attr('cy', function (d) {
          return y(d.y);
        })
        .attr('r', function (d) {
          return d.r;
        })
        .style('stroke-width', 1)
        .style('stroke', function (d) {
          return d.color;
        })
        .style('fill', function (d) {
          return d.color;
        })
        .style('fill-opacity', 0.3);

      const xAxis = d3.axisBottom(x).ticks(6);
      const yAxis = d3.axisLeft(y).ticks(6);

      const cX = container.append('g')
        .attr('transform', 'translate(' + margin.h + ', ' + (contentSize.height + margin.v) + ')')
        .call(xAxis);
      const cY = container.append('g')
        .attr('transform', 'translate(' + margin.h + ', ' + margin.v + ')')
        .call(yAxis);

      function zoom() {
        content.attr('transform', d3.event.transform);
        cX.call(xAxis.scale(d3.event.transform.rescaleX(x)));
        cY.call(yAxis.scale(d3.event.transform.rescaleY(y)));
      }
    }
  }

  /**
   * 对数字按照指定取整
   * @param  {Number}  n      源数据
   * @param  {Number}  sn     指定整数
   * @param  {Boolean} isCeil 是否向上取整
   * @return {Number}         处理后的数据
   */
  function roundNumber(n, sn, isCeil) {
    if (isCeil) {
      return (Math.floor(n / sn) + 1) * sn;
    } else {
      return (Math.floor(n / sn)) * sn;
    }
  }

  exports.candleStick = candleStick;
  exports.occurrence = occurrence;
  exports.iris = iris;
}));