[(#REM) Derniers articles ]
<B_articles_recents>
<div class="menu articles">
	[(#ANCRE_PAGINATION)]
	<h2><:derniers_articles:></h2>
	<ul>
		<BOUCLE_articles_recents(ARTICLES) {par date}{inverse} {pagination 5}>
		<li class="hentry">
			[(#LOGO_ARTICLE{#URL_ARTICLE}|image_reduire{150,100})]
			<h3 class="entry-title"><a href="#URL_ARTICLE" rel="bookmark">#TITRE</a></h3>
			<small><abbr class="published"[ title="(#DATE|date_iso)"]>[(#DATE|affdate_jourcourt)]</abbr>[, <:par_auteur:> (#LESAUTEURS)]</small>
		</li>
		</BOUCLE_articles_recents>
	</ul>
	[<p class="pagination">(#PAGINATION)</p>]
</div>
</B_articles_recents>