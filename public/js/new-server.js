$(document).ready(function() {
	refreshMachines();

	$("#new-server-tab").click(showNewServerTab);
	$("#existing-server-tab").click(showExistingServerTab);

	$("#game-select").change(getGameFields);

	$("#refresh-machines").click(refreshMachines);

	$("#reset-new-server-form").click(getGameFields);

	$("#new-server-form").submit(submitNewServerForm);
});

function submitNewServerForm(e) {
	e.preventDefault();

	$("#submit-new-server-form").addClass("is-loading");
	$("#new-server-form").attr("disabled", true);
	
	var gameAbbr = $("#game-select").val();
	var machineID = $("#machine-select").val();
	var params = [];
	$("#game-setup-fields table tbody tr").each(function() {
		var key = $(this).find("td:first input").val();
		var value = $(this).find("td:last input").val();

		if (key != "") {
			params.push([key, value]);
		}
	});

	$.post("/server/install", {
			"game": gameAbbr,
			"machine": machineID,
			"params": JSON.stringify(params),
			"launchOpt": $("#launch-opt").val()
		}, function(resp) {
			if (!resp.success) {
				switch (resp.error) {
					case "not-logged-in":
						alertify.error("You aren't logged in");
						break;

					case "missing-param-game":
						alertify.error("Something went wrong");
						break;

					case "missing-param-machine":
						alertify.error("Something went wrong");
						break;

					case "invalid-param-machine":
						alertify.error("Something went wrong");
						break;

					case "machine-does-not-exist":
						alertify.error("That machine doesn't exist");
						break;

					case "database-error":
						alertify.error("An error occured with the database");
						break;

					case "params-failed":
						alertify.error("Something went wrong");
						break;

					case "machine-connection-failed":
						alertify.error("Failed to connect to the remote host machine");
						break;

					case "missing-deps":
						var data = JSON.parse('{"' + decodeURI(this.data).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
						var li = "<ul>";
						$.each(resp.dependencies.missing, function(i, dep) { 
								li += "<li>" + dep + "</li>";
						});
						li += "</ul>"
						alertify.okBtn("Install as root").confirm("The remote host is missing the following dependencies:"+li,
							function() {
								// Install dependencies
								alertify.reset().prompt("Enter <b>root</b> password for remote host",
									function(password) {
										// Install dependencies
										var installDepsData = {
											machineID: data.machine,
											rootPassword: password,
											game: data.game
										}
										$.post("/machine/install-dependencies", installDepsData,
											function (resp) {
												if (resp.success) {
													alertify.success("Successfully installed dependencies");
													return;
												}

												switch (resp.error) {
													case "not-logged-in":
														alertify.error(errorMsgs.notLoggedIn);
														break;
													
													default:
														alertify.error("Failed to install missing dependencies");
														break;
												}

												if (resp.error != "") {
													console.log(resp.error);
												}
											},
											"json"
										);
									});
							});
						break;
				
					default:
						alertify.error("Something went wrong");
						break;
				}
				if (resp.error != "")
					console.log(resp.error);
				return;
			}
		
			window.location = "/servers";
		},
		"json"
	).always(function() {
		$("#submit-new-server-form").removeClass("is-loading");
		$("#new-server-form").attr("disabled", false);	
	});
}

function getGameFields() {
	var gameAbbr = $("#game-select").val();
	var gameSetupURL = "/public/inc/game-setup/" + gameAbbr + ".html";

	$(".configuration-label").hide();
	$("#game-setup-fields").html("");
	$("#submit-new-server-form").attr("disabled", true);
	if (gameAbbr.length > 0) {
		$.ajax({
			type: "GET",
			url: gameSetupURL,
			success: function(body) {
				$("#submit-new-server-form").attr("disabled", false);
				$(".configuration-label").show();
				$("#game-setup-fields").html(body);
			},
			error: function() {
				alertify.error("Failed to retrieve setup fields for " + $("#game-select option[value='"+gameAbbr+"']").text());
			}
		});
	}
}

function showNewServerTab() {
	$("#new-server-tab").addClass("is-active");
	$("#existing-server-tab").removeClass("is-active");

	$("#new-server-form").show();
	$("#existing-server-form").hide();
}

function showExistingServerTab() {
	$("#existing-server-tab").addClass("is-active");
	$("#new-server-tab").removeClass("is-active");

	$("#existing-server-form").show();
	$("#new-server-form").hide();
}

function refreshMachines() {
	$("#refresh-machines").attr("disabled", true);
	$("#refresh-machines").children("i.fa").addClass("spinning");
	$.get("/machine/list",
		function (resp) {
			if (!resp.success) {
				switch (resp.error) {
					case "not-logged-in":
						alertify.error(errorMsgs.notLoggedIn);
						break;

					case "database-error":
						alertify.error(errorMsgs.databaseError);
						break;
				
					default:
						alertify.error(errorMsgs.default);
						break;
				}
				return;
			}

			if (!resp.machines || resp.machines.length === 0) {
				$("#machine-select").parent().addClass("hidden");
				return;
			}

			$("#machine-select").parent().removeClass("hidden");

			$("#machine-select").html("");

			$.each(resp.machines, function(i, m) {
				var title = m.Title;
				if (title == "") {
					title = m.Username + " @ " + m.Addr + ":" + m.Port;
				}
				$("#machine-select").append(`<option value="`+m.ID+`">`+title+`</option>`);
			});
		},
		"json"
	).fail(function() {
		alertify.error(errorMsgs.default);
	}).always(function() {
		$("#refresh-machines").attr("disabled", false);
		$("#refresh-machines").children("i.fa").removeClass("spinning");
	});
}