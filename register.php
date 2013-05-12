<?php
require_once 'define_root.php';
require_once 'Model/Site.php';

if($user->loggedIn()) {
	alert('You were already logged in. Please logout before you can register.','alert-info');
	redirect_to("index.php");
}

if(!empty($_POST)) {
	if( 
		$user->register($_POST['email'],$_POST['password'])
	)
	{
		alert('<strong>Success!</strong> You were registered and logged in!','success');
		redirect_to('index.php');
	}
	else {
		alert(implode($user->errors),'alert-error');
	}
}

require_once INCLUDE_ROOT."view_header.php";
require_once INCLUDE_ROOT."public_nav.php";
?>
<div class="span8">
<h2>Registration</h2>
<form class="form-horizontal" id="register" name="register" method="post" action="register.php">
	<div class="control-group small-left">
		<label class="control-label" for="email">
			<?php echo _("Email"); ?>
		</label>
		<div class="controls">
			<input required type="email" placeholder="email@example.com" name="email" id="email">
		</div>
	</div>
	<div class="control-group small-left">
		<label class="control-label" for="password">
			<?php echo _("Password"); ?>
		</label>
		<div class="controls">
			<input required type="password" placeholder="Please choose a secure phrase" name="password" id="password">
		</div>
	</div>
	<div class="control-group small-left">
		<div class="controls">
			<input required type="submit" value="<?php echo _("Register"); ?>">
		</div>
	</div>
</form>
</div>
<?php
require_once INCLUDE_ROOT."view_footer.php";
