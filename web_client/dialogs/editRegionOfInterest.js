
import View from 'girder/views/View';
import { apiRoot } from 'girder/rest';

import router from '../router';
import editRegionOfInterest from '../templates/dialogs/editRegionOfInterest.pug';
import '../stylesheets/panels/zoomWidget.styl';

var EditRegionOfInterest = View.extend({
	events: {
		'click .h-submit':'downloadArea',
		'change .update-form':'updateform',
	},

	initialize() {
        this._zoom = 0;
        this._width = 0;
        this._height = 0;
        // set defaults
        this._maxMag = 20;
        this._maxZoom = 8;     // have to put the real value of all these variables
        this._sizeCte = 100;
        this._tauxCompression = 0.2; // JPEG is the default format
    },

	render() {
		// Has to be re-structured
		this._width = parseFloat(this.areaElement.width);
        this._height = parseFloat(this.areaElement.height);
        this.$el.html(
            editRegionOfInterest({
            	magnification: this.zoomToMagnification(this.areaElement.zoom),
                element: this.areaElement,
                numberOfPixel: this.getNumberPixels(),
                fileSize: this.getFileSize()
            })
        ).girderModal(this);
	},

	/**
     * Convert from zoom level to magnification.
     */
    zoomToMagnification(zoom) {
        return Math.round(parseFloat(this.areaElement.maxMag)
        	* Math.pow(2, zoom-parseFloat(this.areaElement.maxZoom))*10)/10;
    },

    /**
     * Convert from magnification to zoom level.
     */
    magnificationToZoom(magnification) {
        return parseFloat(this.areaElement.maxZoom)
        	- Math.log2(this.areaElement.maxMag / magnification);
    },

	/**
     * Get the number of pixel in the region of interest
     */
	getNumberPixels(){
		var Npixel = Math.pow(2, this._zoom-parseFloat(this.areaElement.maxZoom))*this._width*this._height;
		return Npixel;
	},

	/**
     * Get the size of the file before download it for an image in 24b/px (result in Bytes)
     */
	getFileSize(){
		var fileSize = (this.getNumberPixels()*3 + this._sizeCte) *this._tauxCompression;
		return fileSize;
	},

	/**
     * Get the size of the file before download it
     */
	updateform(evt){
		// Find the good compresion ration there are random now
		var selected_option = $('#download-image-format option:selected').text();
		switch(selected_option) {
		    case 'JPEG': 	// 	JPEG
		        this._tauxCompression = 0.2;
		        break;
		    case 'PNG': 	//  PNG
		        this._tauxCompression = 0.4;
		        break;
		    case 'TIFF': 	// TIFF
		        this._tauxCompression = 0.8;
		        break;
		    default: 	// JPEG is the default format
		        this._tauxCompression = 0.2;
		}
		this._zoom = Math.round(this.magnificationToZoom(parseFloat($('#h-element-mag').val())));	
		$('#nb-pixel').val(this.getNumberPixels());
		$('#size-file').val(this.getFileSize());
	},

	/**
     * Get all data from the form and set the attributes of the
     * Region of Interest (triggering a change event).
     */
	downloadArea(evt) {
		var image_id = router.getQuery('image');
		var left = this.areaElement.left;
		var top = this.areaElement.top;
		var right = left + this._width;
		var bottom = top + this._height;

		var magnification = parseFloat($('#h-element-mag').val());
		var filename = image_id + '_' + left +'-'+ top +'-'+ right +'-'+ bottom +'-'+ magnification;
		var url_area = apiRoot + '/item/' + image_id + '/tiles/region?'
			+ $.param({width: this._width, height: this._height, left:left,top:top,right:right,bottom:bottom, contentDisposition:'attachment', filename:filename, magnification:magnification});
		var href_attr_area = this.$('a.h-download-link#download-area-link').attr('href');
		// Give a name to the file
		window.location.href = url_area;
		this.$el.modal('hide');
	}
});

/**
 * Create a singleton instance of this widget that will be rendered
 * when `show` is called.
 */
var dialog = new EditRegionOfInterest({
    parentView: null
});

/**
 * Show the edit dialog box.  Watch for change events on the passed
 * `ElementModel` to respond to user submission of the form.
 *
 * @param {ElementModel} areaElement The element to edit
 * @returns {EditRegionOfInterest} The dialog's view
 */
function show(areaElement) {
    dialog.areaElement = areaElement;
    dialog.setElement('#g-dialog-container').render();
    return dialog;
}

export default show;