$(function() {

  Parse.$ = jQuery;

  Parse.initialize("21T2F3tXhktZ9FRoqWEL9XYmKX7H1Ekefts5dnAo",
                   "SmnAnMQWMdJKAPofbIswn1qLEzk3CQ00k3y8g22h");


  var Project = Parse.Object.extend("Project", {
    defaults: {
      title: "new project",
      description: "just getting started",
      status: 'active',
      user: Parse.User.current()
    },

    initialize: function() {
      newProject = this
      if (!newProject.get("title")) {
        newProject.set({"title": newProject.defaults.title});
      }
      if (!newProject.get("description")) {
        newProject.set({"description": newProject.defaults.description});
      }
      if (!newProject.get("status")) {
        newProject.set({"status": newProject.defaults.status});
      }
      newProject.set({"user": Parse.User.current()});
    },
  });

  var Version = Parse.Object.extend("Version", {
    defaults: {
      title: "newest version",
      status: "active",
    },

    initialize: function(project) {
      newVersion = this
      if (!newProject.get("title")) {
        newVersion.set({"title": newVersion.defaults.title});
      }
      if (!newVersion.get("status")) {
        newVersion.set({"status": newVersion.defaults.status});
      }
      newVersion.set("parent", project);
    }
  });

  var ProjectsList = Parse.Collection.extend({
    model: Project,

    all: function() {
      var query = new Parse.Query(Project);
      return query.equalTo("user", Parse.User.current()).descending('createdAt');
    },

    active: function() {
      var query = new Parse.Query(Project);
      query.equalTo("user", Parse.User.current());
      return query.equalTo("status", "active").descending('createdAt');
    },

    submitted: function() {
      var query = new Parse.Query(Project);
      query.equalTo("user", Parse.User.current());
      return query.equalTo("status", "submitted").descending('createdAt');
    },

    approved: function() {
      var query = new Parse.Query(Project);
      query.equalTo("user", Parse.User.current());
      return query.equalTo("status", "approved").descending('createdAt');
    },

  });

  var VersionsList = Parse.Collection.extend({
    model: Version,

    all: function(project) {
      var query = new Parse.Query(Version);
      query.equalTo("parent", project).descending('createdAt');
      query.find({
        success: function(results) {
          return results;
        },
      });
    },
  });

  var ManageProjectsView = Parse.View.extend({
    el: ".content",

    events: {
      "click .log-out": "logOut",
      "click .project-link": "goToProject",
      "submit form.new-project-form": "createProject",
    },

    initialize: function() {
      this.projects = new ProjectsList;
      this.projects.query = this.projects.all();
      var self = this;
      this.projects.fetch({
        success: function(){
          self.render()
        }
      });
      _.bindAll(this, "logOut", "createProject", "addOne", "addAll", "goToProject");
    },

    logOut: function() {
      Parse.User.logOut();
      new LogInView();
      this.undelegateEvents();
      delete this;
    },

    addOne: function(project) {
      var view = new ProjectListView({model: project});
      this.$("#project-list").append(view.render().el);
    },

    addAll: function() {
      this.$("#project-list").html("");
      this.projects.each(this.addOne);
    },

    createProject: function() {

      this.projects.create({
        title:       this.$("#new-project-title").val(),
        description: this.$("#new-project-description").val(),
      });

      this.render();

    },

    goToProject: function(e) {
      var query = new Parse.Query('Project');
      query.get(e.currentTarget.id, {
        success: function(result) {
          var view = new ProjectView({model: result});
          view.render();
        },
        error: function(error){
          alert("Error" + " " + error.message);
        }
      });
    },

    render: function() {
      this.$el.html(_.template($("#manage-projects-template").html()));
      this.addAll();
      this.delegateEvents();
    }
  });

  var ProjectView = Parse.View.extend({
    el: ".content",

    template: _.template($('#project-view-template').html()),

    events: {
      "submit form.new-version-form": "createVersion",
    },

    initilize: function() {
      _.bindAll(this, "createVersion", "addOne", "addAll");
    },

    addOne: function(version) {
      var view = new VersionView({model: version});
      this.$("#version-list").append(view.render().el);
    },

    addAll: function() {
      this.$("#versions-list").html("");
      this.versions = new VersionsList;
      this.versions.query = this.versions.all(this.model);
      this.versions.each(this.addOne);
    },

    createVersion: function() {

      this.versions.create({
        title:       this.$("#new-version-title").val(),
        description: this.$("#new-version-description").val(),
        parent:      this.model.parent
      });

      this.render();

    },

    render: function() {
      this.$el.html(_.template($("#project-view-template").html(), this.model.toJSON()));
      this.addAll();
      this.delegateEvents();
    }
  });

  var ProjectListView = Parse.View.extend({
    tagName: "li",

    template: _.template($('#project-li-template').html()),

    initialize: function() {
      _.bindAll(this, 'render');
    },

    render: function() {
      $(this.el).html(this.template(this.model.toJSON()));
      this.input = this.$('.edit');
      return this;
    },
  });

  var LogInView = Parse.View.extend({
    events: {
      "submit form.login-form": "logIn",
      "click .sign-up": "signUp"
    },

    el: ".content",

    initialize: function() {
      _.bindAll(this, "logIn", "signUp");
      this.render();
    },

    logIn: function(e) {
      var self = this;
      var username = this.$("#login-username").val();
      var password = this.$("#login-password").val();

      Parse.User.logIn(username, password, {
        success: function(user) {
          new ManageProjectsView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
          self.$(".login-form .error").html("Invalid username or password. Please try again.").show();
          this.$(".login-form button").removeAttr("disabled");
        }
      });

      this.$(".login-form button").attr("disabled", "disabled");

      return false;
    },

    signUp: function() {
      new SignUpView();
    },

    render: function() {
      this.$el.html(_.template($("#login-template").html()));
      this.delegateEvents();
    }
  });

  var SignUpView = Parse.View.extend({
    events: {
      "submit form.signup-form": "signUp",
      "click .log-in": "logIn"
    },

    el: ".content",

    initialize: function() {
      _.bindAll(this, "signUp");
      this.render();
    },

    signUp: function(e) {
      var self = this;
      var username = this.$("#signup-username").val();
      var password = this.$("#signup-password").val();

      Parse.User.signUp(username, password, { ACL: new Parse.ACL() }, {
        success: function(user) {
          new ManageProjectsView();
          self.undelegateEvents();
          delete self;
        },

        error: function(user, error) {
          self.$(".signup-form .error").html(error.message).show();
          this.$(".signup-form button").removeAttr("disabled");
        }
      });

      this.$(".signup-form button").attr("disabled", "disabled");

      return false;
    },

    logIn: function() {
      new LogInView();
    },

    render: function() {
      this.$el.html(_.template($("#signup-template").html()));
      this.delegateEvents();
    }
  });

  var AppView = Parse.View.extend({
    el: $("#loopdinapp"),

    initialize: function() {
      this.render();
    },

    render: function() {
      if (Parse.User.current()) {
        new ManageProjectsView();
      } else {
        new LogInView();
      }
    }
  });

  var AppState = Parse.Object.extend("AppState", {
    defaults: {
      filter: "all"
    }
  });

  var state = new AppState
  new AppView;

});
