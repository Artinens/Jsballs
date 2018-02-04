'use strict';

/* MODEL */

var WIDTH  = window.innerWidth, 			// width of SVG container
	HEIGHT = window.innerHeight,			// height of SVG container
	minRadius = (WIDTH + HEIGHT) / 120,		//
	maxRadius = (WIDTH + HEIGHT) / 100,		//
	lineWidth = (WIDTH + HEIGHT) / 1000,	//
	padding = minRadius * 4,
	svg,									// context
	drag,									// drag handler
	gLink,									// container for lines
	gNode,									// conteiner for arcs
	nodes,									// array of nodes
	links;									// array of links

svg = d3.select('#chart')
	.append('svg')
		.attr('width', WIDTH)
		.attr('height', HEIGHT);

svg.append('g').attr('id', 'gLinks');	// layer for paths
svg.append('g').attr('id', 'gNodes');	// layer for arcs

gLink = svg.selectAll('#gLinks');		
gNode = svg.selectAll('#gNodes');

nodes = [];
links = [];

/* VIEW */

function hideAll() {
	svg.selectAll('circle')
		.attr('opacity', 0.1);

	svg.selectAll('path')
		.attr('opacity', 0.1);
}

function openAll() {
	svg.selectAll('circle')
		.attr('opacity', 1);

	svg.selectAll('path')
		.attr('opacity', 1);
}

function openPath(id) {
	nodes[id].data()[0].visible = true;

	for (var count = 50; count --;) {
		for (var i = nodes.length; i --;) {
			if (nodes[i].data()[0].visible == true) {
				nodes[i].attr('opacity', 1);

				for (var j = nodes[i].data()[0].neighborsIDs.length; j --;) {
					nodes[nodes[i].data()[0].neighborsIDs[j]].data()[0].visible = true;
				}

				for (var j = nodes[i].data()[0].linkIDs.length; j --;) {
					links[nodes[i].data()[0].linkIDs[j]].attr('opacity', 1);
					links[nodes[i].data()[0].linkIDs[j]].data()[0].visible = true;
				}
			}
		}
	}
}

function create_node(id, x, y, color) {
	return gNode.append('circle')
		.data([{'id': id, 'x': x, 'y': y, 'neighborsIDs': [], 'linkIDs': [], 'visible': false}])
		.attr('transform', 'translate(' + x + ',' + y + ')')
		.attr('r', minRadius)
		.style('fill', color)
		.attr('stroke-width', 1)
		.attr('stroke', '#000')
		.attr('opacity', 1)
		.on('mouseover', mouse_over)
		.on('mouseleave', mouse_out)
		.call(drag);
}

function create_link(myID, node0id, node1id) {
	nodes[node0id].data()[0].neighborsIDs.push(node1id);
	nodes[node0id].data()[0].linkIDs.push(myID);
	nodes[node1id].data()[0].neighborsIDs.push(node0id);
	nodes[node1id].data()[0].linkIDs.push(myID);

	return gLink.append('path')
		.data([{'id': myID, 'neighborsIDs': [node0id, node1id], 'visible': false}])
		.attr('stroke', '#aaa')
		.attr('stroke-width', lineWidth)
		.attr('fill', 'none')
		.attr('opacity', 1)
}

/* CONTROLL */


function update_link(id) {
	var bezierLine = d3.svg.line()
		.x(function(d) {return d[0]})
		.y(function(d) {return d[1]})
		.interpolate('basis');

	var node0id = links[id].data()[0].neighborsIDs[0],
		node1id = links[id].data()[0].neighborsIDs[1]

	var x0 = nodes[node0id].data()[0].x,
		y0 = nodes[node0id].data()[0].y,
		x1 = nodes[node1id].data()[0].x,
		y1 = nodes[node1id].data()[0].y;

	var xm0 = x0 > x1 ? x0 - padding : x0 + padding,
		ym0 = y0 > y1 ? y0 - padding : y0 + padding,
		xm1 = x1 < x0 ? x1 + padding : x1 - padding,
		ym1 = y1 > y0 ? y1 - padding : y1 + padding;

	links[id].attr('d', bezierLine([[x0, y0], [xm0, ym0], [xm1, ym1], [x1, y1]]));
}

function generate_nodes() {
	var count = 0;
	for (var i = 15; i --;) {
		var x = Math.random() * WIDTH / 5,
			y = Math.random() * HEIGHT * 0.8 + HEIGHT * 0.1;

		nodes.push(create_node(count, x, y, '#00f'));
		count ++;
	}

	for (var i = 15; i --;) {
		var x = Math.random() * WIDTH / 5 + WIDTH / 5 * 2,
			y = Math.random() * HEIGHT * 0.8 + HEIGHT * 0.1;

		nodes.push(create_node(count, x, y, '#ff0'));
		count ++;
	}

	for (var i = 20; i --;) {
		var x = Math.random() * WIDTH / 5 + WIDTH / 5 * 4,
			y = Math.random() * HEIGHT * 0.8 + HEIGHT * 0.1;

		nodes.push(create_node(count, x, y, 'hsl(' + Math.random() * 360 + ', 100%, 50%)'));
		count ++;
	}
}

function generate_links() {
	var count = 0;

	for (var i = 0; i < nodes.length; i ++) {

		var randID = Math.floor(Math.random() * nodes.length);
		links.push(create_link(count, i, randID));

		update_link(count);
		count ++;
	}

	for (var i = 0; i < nodes.length; i ++) {

		var randID = Math.floor(Math.random() * nodes.length);
		//links.push(create_link(count, i, randID));
		links.push(create_link(count, i, i));

		update_link(count);
		count ++;
	}
}

drag = d3.behavior.drag()

	.on('dragstart', function(d, i) {
		d3.select(this).attr('r', maxRadius);

		mouse_over(d, i);
	})

	.on('drag', function(d, i) {
		d.x = d3.event.x;
		d.y = d3.event.y;

		d3.select(this)
			.attr('transform', function(d, i){
				return 'translate(' + [d.x, d.y] + ')';
			});

		for (var i = d.linkIDs.length; i --;)
			update_link(d.linkIDs[i]);
	})
	.on('dragend', function(d, i) {
		d3.select(this).attr('r', minRadius);

		mouse_out();
	})

function mouse_over(d, i) {
	hideAll();
	openPath(d.id);
}

function mouse_out(d, i) {
	openAll();

	for (var count = nodes.length; count --;)
		nodes[count].data()[0].visible = false;

	for (var count = links.length; count --;)
		nodes[count].data()[0].visible = false;
}

generate_nodes();
generate_links();