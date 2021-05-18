<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:foo="http://www.foo.org/" xmlns:bar="http://www.bar.org">

<xsl:template match="/">
<results>
	<testproject name="bintra" prefix="BINTRA" />
	<testplan name="smoke" />
	<build name="1.0" />
	<platform name="default" />
	<xsl:for-each select="testExecutions/file">
		<xsl:for-each select="testCase">
			<xsl:analyze-string select="@name" regex="\[(BINTRA-\d+)\].+">
				<xsl:matching-substring>
					<xsl:variable name="myid"><xsl:value-of select="regex-group(1)"/></xsl:variable>
					<testcase external_id="{$myid}">
						<result>P</result>
						<notes><xsl:value-of select="."/></notes>
						<tester></tester>
						<timestamp><xsl:value-of select="current-dateTime()"/></timestamp>
						<steps>
							<step>
								<step_number>1</step_number>
								<result>p</result>
								<notes>your step exec notes</notes>
							</step>
						</steps>
					</testcase>
				</xsl:matching-substring>
			</xsl:analyze-string>
		</xsl:for-each>
	</xsl:for-each>
</results>
</xsl:template>
</xsl:stylesheet>
