var allUsers = [];
function registerSigninEvents() {
	$("#signin").click(function(e) {
		$("#signin-error-panel").hide();
		
		var user = $("#inputAccount").val(),
			password = $("#inputPassword").val();
			
		if (user == "" || password == "") return;
		
		e.preventDefault();
		
		$.print("Logging in by: " + user);
		BaasBox.login(user, password)
			.done(function(res) {
				loginSuccess(res);
				//$("#inputAccount").val("");
				//$("#inputPassword").val("");
			})
			.fail(function (err) {
				$("#signin-error-panel").fadeIn();
			});
	});
	
	$("#inputAccount, #inputPassword").keyup(function(event){
		if(event.keyCode == 13) { // 13 means "enter"
			$("#signin").click();
		}
	});
	
	$("#signout").click(function(){
		BaasBox.logout();
		logout();
	});
	
}

function registerUsersEvents() {
	$("#signup-gate").click(function(event) {
		$("#signin-error-panel").hide('slideUp');
		$("#signin-form").fadeOut(function() {
			$("#signup-form").fadeIn();
		});
	});

	$("#signin-gate").click(function(event) {
		$("#signin-error-panel").hide('slideUp');
		$("#signup-form").fadeOut(function() {
			$("#signin-form").fadeIn();
		});
	});

	// TODO: check need refactory to one place
	$("#new-account").on("change", function(e){
		var user = $("#new-account").val();
		$.get(BaasBox.endPoint + "/plugin/users.exist?username=" + user)
			.done(function(res){
				if (res.data === "exist"){
					$.notify("User name [" + user + "] has been used.");
				}
			});
	});

	$("#signup").click(function(e) {
		e.preventDefault();

		$("#signup-error-panel").hide();
		
		var user = $("#new-account").val(),
			password = $("#new-password").val(),
			password2 = $("#re-password").val(),
			userInfo = {
				name: $("#new-name").val(),
				email: $("#new-email").val(),
			}; 
		
		// TODO: better checks
		if (password !== password2) {
			$("#signup-error-panel").text("please confirm password").fadeIn();
			return;
		}

		if (userInfo.email.indexOf('@') === -1){
			$("#signup-error-panel").text("Invalid email").fadeIn();
			return;
		}
		if (userInfo.name === ""){
			$("#signup-error-panel").text("Invalid name").fadeIn();
			return;
		}

		BaasBox.signup(user, password, {"visibleByTheUser": userInfo})
			.done(function(res) {
				$.print("signup success");
				$.print(res);
				$("#signup-form").fadeOut(function() {
					loginSuccess(res);
				});
			})
			.fail(function (err) {
				var errInfo = JSON.parse(err.responseText);
				$("#signup-error-panel").text("Error: " + errInfo.message).fadeIn();
				$("#signup-error-panel").fadeIn();
			});
	});

	$("#forgot-password").click(function(event) {
		var user = $("#inputAccount").val();

		$("#reset-password-confirm").modal();
		$("#reset-password-account").val(user);
	});

	$("#reset-password").click(function(event) {
		var user = $("#reset-password-account").val();
		// same as BaasBox.resetPassword();
		$.get(BaasBox.endPoint + '/user/' + user + '/password/reset')
			.done(function(res) {
				$.print("resetPassword mail send");
				$.notify("resetPassword mail send");
			})
			.fail(function (err) {
				var errInfo = JSON.parse(err.responseText);
				var errMsg = errInfo.message;
				$.print(errMsg);
				$.notify(errMsg);
			});

		$("#reset-password-confirm").modal('hide');
	});
    
    $("#user-list").click(function(event) {
        BaasContact.Views.Modes.goListUsers();
		BaasContact.Models.Users.loadUsers();
    });
    
    $("#active-user-list").on("click", "button", function(e){
        var $user = $(this).closest("li");
        $.print($user.data());
        var name = $user.data("name");
        
        BaasContact.Models.Users.suspendUser(name);
    });
    
    $("#suspended-user-list").on("click", "button", function(e){
        var $user = $(this).closest("li");
        $.print($user.data());
        var name = $user.data("name");
        
		BaasContact.Models.Users.activateUser(name);
    });
    
    $("#change-username").click(function(event) {
        BaasContact.Views.Modes.goChangeUsername();
    });
    
    $("#change-username-btn").click(function(event) {
        var newUser = $("#chagne-new-username").val();
        BaasContact.Models.Users.changeUserName(newUser);
        BaasContact.Views.Modes.goApp();
    });
    
    $("#change-password-form-cancel-btn, #change-username-form-cancel-btn, #exit-user-list-btn").click(function(event) {
        BaasContact.Views.Modes.goApp();
    });
        
}

BaasContact.Models.Users = (function() {
	var allUsers = {};
	var loadUsers = function () {
		 BaasBox.fetchUsers()
            .done(function(res){
            	
                // data
                allUsers = [];

                for (var i = 0; i < res.data.length; i++){
                    var isActive, 
                        status = res.data[i].user.status;
                    
                    switch (status){
                    case "ACTIVE":
                        isActive = true;
                        break;
                    case "SUSPENDED":
                        isActive = false;
                        break;
                    default:
                        isActive = false;
                        if(DEBUG){
                            $.notify("User status is: " + status);
						}
                        break;
                    }
                    
                    var name = res.data[i].user.name; 
                    var user = {
                        name: name,
                        isActive: isActive
                    }
                    //allUsers.push(user);
                    allUsers[name] = user;
                }
                
                // view
                BaasContact.Views.Users.renderUsers(allUsers);
            })
            .fail(BaasContact.Views.Error.log);
	};
	var suspendUser = function(name) {
		BaasBoxEx.suspendUser(name)
	        .done(function(res){
	        	allUsers[name].isActive = false;
				BaasContact.Views.Users.renderUsers(allUsers);
	        })
	        .fail(BaasContact.Views.Error.log);
	};
	var activateUser = function(name) {
		BaasBoxEx.activateUser(name)
			.done(function(res){
	            allUsers[name].isActive = true;
	            BaasContact.Views.Users.renderUsers(allUsers);
	        }).fail(BaasContact.Views.Error.log);
    };
    
    var changeUserName = function(name) {
        BaasBoxEx.changeUserName(name)
            .done(function(res){
	            $.print("change name success");
	        }).fail(BaasContact.Views.Error.log);
    };
    
	return {
		loadUsers:        loadUsers,
		suspendUser:      suspendUser,
		activateUser:     activateUser,
        changeUserName:   changeUserName
	};
})();


BaasContact.Views.Error = {};
BaasContact.Views.Error.log = function(err) {
	var errMsg = JSON.stringify(err);
	$.print(errMsg);
	$.notify(errMsg);
};

BaasContact.Views.Users = {
	renderUsers : function(users) {
	    var $active = $("#active-user-list"); 
	    var $suspend = $("#suspended-user-list");
	    
	    $active.empty();
	    $suspend.empty();

	    //for (var i = 0; i < users.length; i++){
    	for (var i in users) {
    		if (users.hasOwnProperty(i)) {
    			$.print(i);
		        if (users[i].isActive){
		            var $user = $('<li class="list-group-item">&nbsp;' + users[i].name + '<button class="list-users-right">Suspend</button></li>');
		            $user.data("name", users[i].name);
		            $active.append($user);
		        } else {
		            var $user = $('<li class="list-group-item">&nbsp;' + users[i].name + '<button class="list-users-right">Activate</button></li>');
		            $user.data("name", users[i].name);
		            $suspend.append($user);
		        }
		    }
	    }
	},
	removeUser : function(name) {
		$.print(res);
        $user.remove().appendTo("#suspended-user-list").find("button").text("Suspend");
	}
};

var registerPersonEvents = function() {
    var $upload = $("#upload-face-img");
    $upload.hover(
        function() {
            $(this).find("div.float-buttom").fadeTo(200, 0.5);
        },function() {
            $(this).find("div.float-buttom").fadeTo(200, 0.0);
        });

    $upload.find("input").on("change", uploadImg);
};
var uploadImg = function(e) {
    var files = e.target.files;
    if (files.length < 0) return;
    var file = files[0];
    if (!file.type.match('image.*')) {
        $.notify(file.name + " is not a image");
        return;
    }

    var formData = new FormData();
    formData.append("upload", file, file.name);

    $.notify("Uploading " + file.name + "...");
    BaasContact.Models.Person.updatePersonalPortrait(formData);
};


BaasContact.Models.Person = (function () {
    // class Person
    var Person = function(data) {
        this.data = data;
    };
    var PersonPrototype = Person.prototype;
    PersonPrototype.isAdmin = function() {
        var roles = this.data.user.roles;
        for (var i = 0; i < roles.length; i++) {
            if (roles[i].name == BaasBox.ADMINISTRATOR_ROLE) {
                return true;
            }
        }
        return false;
    };
    PersonPrototype.setPortrait = function(imgId) {
        this.data.visibleByAnonymousUsers.portraitImg = imgId;
    } 
    PersonPrototype.getPortrait = function() { return this.data.visibleByAnonymousUsers.portraitImg; };
    PersonPrototype.getPublicInfo = function() { return this.data.visibleByAnonymousUsers; };
    PersonPrototype.getName = function() { return this.data.user.name; };

    // data
    var me = new Person();
    
    // methods
    var loadMySelf = function(){
        BaasBox.fetchCurrentUser()
            .done(function(res){
                if (res.result === "ok") {
                    var person = new Person(res.data);
                    setMySelf(person);
                } else {
                    $.notify("Login error");
                    $.print(data);
                    logout();    
                }
            })
            .fail(function(){
                // an error of login
                $.notify("Your login has expired");
                logout();
            });
    };
    var setMySelf = function(person){
        me = person;
        BaasContact.Views.Person.renderPerson(me);
    };
    
    var _updateMySelf = function() {
        return BaasBox.updateUserProfile(me.data);
    };
    
    var updatePersonalPortrait = function(formData) {
        _updateFile(formData)
            .done(function(res) {
                var info = JSON.parse(res);
                var imgId = info.data.id;
                
                me.setPortrait(imgId);
                return _updateMySelf();
            })
            .done(function(res){
                BaasContact.Views.Person.displayPortraitImg(me.getPortrait());
            })
            .fail(function(error){
                var info = JSON.parse(error.responseText);
                var message = info.message;
                $.notify("Error on uploading image. message: " + message);
            });
    };
    
    var _updateFile = function(formData) {
        return BaasBox.uploadFile(formData);
    };
    
    var updateProfileImg = function (imgId) {
        me.data.visibleByAnonymousUsers.profileImg = imgId;
        BaasBox.updateUserProfile(me.data);
    };
    
    var getMySelf = function() { return me; }
    
    return {
        loadMySelf: loadMySelf,
        getMySelf: getMySelf,
        updatePersonalPortrait: updatePersonalPortrait,
        Person: Person
    };
}());

BaasContact.Views.Person = (function () {
    var renderAccountName = function(name){
        $("#account-name").text(name);
    };
    
    var displayPortraitImg = function(imgId){
        if (!imgId) return;
        BaasBox.fetchFile(imgId, true)
            .done(function(res){
                $("#profile-face-thumb img").attr("src", this.url);
            });
    };
    
    var _clearPortraitImg = function() {
        $("#profile-face-thumb img").attr("src", "");
    };
    
    var renderPerson = function(person) {
        // todo use class Person's methods
        var personInfo = person.data;
        $.print("personInfo:");
        $.print(personInfo);
        
        $("#profile-name").text(personInfo.user.name);
        $("#profile-intro").text(personInfo.user.intro);
        
        var joinDate = new Date(personInfo.signUpDate);
        $("#prfile-join-date").text(joinDate.toLocaleDateString());
        
        if (personInfo.visibleByAnonymousUsers) {
            displayPortraitImg(person.getPortrait());
            bindContact(personInfo); // this is a todo
        } else {
            _clearPortraitImg();
        }

        var rawInfo = {};
        for(var key in personInfo) {
            if (key.indexOf("visibleBy") > -1) {
                $.extend(rawInfo, personInfo[key]);
            }
        }
        var text = "<p>";
        for(var key in rawInfo) {
            text += key + " : " + rawInfo[key] + " <br />";
        }
        text += "</p>";
        $("#profile-intro").html(text);
    }
    
    return {
        renderAccountName: renderAccountName,
        renderPerson: renderPerson,
        displayPortraitImg: displayPortraitImg
    };
}());

var bindContact = function(userInfo) {
    var me = BaasContact.Models.Person.getMySelf();
    var publicInfo = BaasContact.Models.Person.getMySelf().getPublicInfo();
    if (!publicInfo.contactId) {
        $.notify("Welcome new comer: " + me.getName());
    }
};
