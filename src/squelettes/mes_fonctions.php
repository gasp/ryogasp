<?php

/**
 * Balises et critères des squelettes ryogasp
 *
**/

if (!defined("_ECRIRE_INC_VERSION")) return;	#securite

function myrand(){
	return rand();
}

function portfolio_image_ratio($im){
	return largeur($im)/hauteur($im);
}

$GLOBALS['quota_cache'] = 1024;