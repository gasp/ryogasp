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

function rot13($str) {
	return str_rot13($str);
}

/**
 * This by no way is a safe encryption system,
 * it's only aiming to make it "non obvious" because in 2024,
 * IA may not be able to deduce the image path based on the obfuscated one
 * or maybe they will, then I'll have to upgrade to a real encryption scheme
 */
function obfusquer_chemin_image($str) {
	if (preg_match('/^local\/cache-vignettes\/L([0-9]{1,4})xH([0-9]{1,4})\/(.*)\?([0-9]+)$/', $str, $matches)) {
		$largeur = $matches[1];
		$hauteur = $matches[2];
		$fichier = $matches[3];
		$ts = $matches[4];
		$extension = pathinfo($fichier, PATHINFO_EXTENSION);
		switch ($extension) {
			// based on https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
			case 'jpg':
				$ext = 'a';
				break;
			case 'jpeg':
				$ext = 'b';
				break;
			case 'gif':
				$ext = 'c';
				break;
			case 'png':
				$ext = 'd';
				break;
			case 'bmp':
				$ext = 'e';
				break;
			case 'apng':
				$ext = 'f';
				break;
			case 'svg':
				$ext = 'g';
				break;
			case 'webp':
				$ext = 'h';
				break;
			default:
				$ext = 'z';
				break;
		}
		preg_match('/(.*)\.[a-z]{3,4}$/', $fichier, $noext);
		return $largeur.$ext.strrev(str_rot13($noext[1])).'/'.$hauteur.'/'.$ts;
	}
	return 'mismatch';
}

$GLOBALS['quota_cache'] = 1024;