<?php
Template::load('public/header', array(
	'headerClass' => 'fmr-small-header',
));
?>


<section id="fmr-features" style="padding-top: 2em;">
	<div class="container">
		<div class="row text-center row-bottom-padded-md">
			<div class="col-md-8 col-md-offset-2">
				<h2 class="fmr-lead animate-box">Publications</h2>
				<p class="fmr-sub-lead animate-box">Publications using data collected with the formr.org software</p>
			</div>
		</div>
		<div class="row">
			<div class="col-md-12">
				<?php
				/**
				 * For now publications are manually read from a pre-configured file as whole-text
				 * @TODO implement a more reasonable storage for publication
				 */
				$file = Config::get('publications_file', APPLICATION_ROOT . 'webroot/assets/publications.html');
				if (file_exists($file)) {
					echo file_get_contents($file);
				}
				?>
			</div>
			<p>&nbsp;</p>
			<div class="alert alert-info">
				<p>
					
					<i class="fa fa-info-circle"></i> &nbsp; If you are publishing research conducted using formr, <strong>please cite</strong> 
				</p>
				<blockquote>
					Arslan, R.C., &amp; Tata, C.S. (2017). formr.org survey software (Version <?php echo Config::get('version'); ?>). <a href="https://zenodo.org/badge/latestdoi/11849439"><img src="https://zenodo.org/badge/11849439.svg" alt="DOI"></a>
				</blockquote>
				<p>
					Once your research is published, 
					you can send to us by email to <a href="mailto:rubenarslan@gmail.com">rubenarslan@gmail.com</a> or <a href="mailto:cyril.tata@gmail.com">cyril.tata@gmail.com</a> 
					and it will be added to the list of publications.
				</p>
			</div>
		</div>
	</div>
</section>

<?php Template::load('public/footer'); ?>
